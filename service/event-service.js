/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const {
	GameEvent,
	UserState,
	UserEvent,
	UserEventSetting,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');
const marketService = require('./market-service');

class EventService {
	async createEvents(events) {
		try {
			const createdEvents = [];

			for (const eventData of events) {
				// Try to find existing event with the same name
				let event = await GameEvent.findOne({
					where: { name: eventData.name },
				});

				if (event) {
					// Update existing event
					await event.update(eventData);
					createdEvents.push(event);
				} else {
					// Create new event
					event = await GameEvent.create(eventData);
					createdEvents.push(event);
				}
			}

			return { events: createdEvents };
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to create events: ' + err.message
			);
		}
	}

	async createEvent(eventData) {
		const t = await sequelize.transaction();

		try {
			const event = await GameEvent.create(eventData, { transaction: t });

			await t.commit();
			return event;
		} catch (err) {
			await t.rollback();
			throw ApiError.BadRequest('Failed to create event: ' + err.message);
		}
	}

	async updateEvent(eventId, eventData) {
		const t = await sequelize.transaction();

		try {
			// Ищем событие по ID
			const event = await GameEvent.findByPk(eventId, { transaction: t });

			if (!event) {
				await t.rollback();
				throw ApiError.NotFound('Event not found');
			}

			// Обновляем данные события
			await event.update(eventData, { transaction: t });

			await t.commit();
			return event;
		} catch (err) {
			await t.rollback();
			throw ApiError.BadRequest('Failed to update event: ' + err.message);
		}
	}

	async checkAndTriggerEvents(userId) {
		const t = await sequelize.transaction();

		try {
			const now = new Date();

			// Получаем или создаем настройки событий пользователя
			let userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				userEventSettings = await UserEventSetting.create(
					{
						userId,
						eventMultipliers: {
							production: 1.0,
							chaos: 1.0,
							stability: 1.0,
							entropy: 1.0,
							rewards: 1.0,
						},
						lastEventCheck: now,
						eventCooldowns: {},
						enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
						disabledEvents: [],
						priorityEvents: [],
					},
					{ transaction: t }
				);
			}

			// Получаем все доступные события
			const availableEvents = await GameEvent.findAll({
				where: { active: true },
				transaction: t,
			});

			// Получаем активные события пользователя
			const activeUserEvents = await UserEvent.findAll({
				where: {
					userId,
					status: 'ACTIVE',
				},
				transaction: t,
			});

			// Проверяем и обновляем статусы существующих событий
			for (const userEvent of activeUserEvents) {
				// Проверяем, не истекло ли событие
				if (userEvent.expiresAt && userEvent.expiresAt <= now) {
					userEvent.status = 'EXPIRED';
					await userEvent.save({ transaction: t });

					// Удаляем эффекты истекшего события
					if (userEvent.effects) {
						for (const [key, value] of Object.entries(
							userEvent.effects
						)) {
							if (userEventSettings.eventMultipliers[key]) {
								userEventSettings.eventMultipliers[key] /=
									value;
							}
						}
						await userEventSettings.save({ transaction: t });
					}
				}
			}

			// Проверяем и триггерим новые события
			const triggeredEvents = [];
			for (const event of availableEvents) {
				const shouldTrigger = await this.shouldEventTrigger(
					event,
					userId,
					now,
					userEventSettings,
					t
				);

				if (shouldTrigger) {
					const duration = event.effect.duration || 0;
					const expiresAt =
						duration > 0
							? new Date(now.getTime() + duration * 1000)
							: null;

					const newEvent = await UserEvent.create(
						{
							userId,
							eventId: event.id,
							status: 'ACTIVE',
							triggeredAt: now,
							expiresAt: expiresAt,
							effects: event.effect.multipliers || {},
							progress: {},
						},
						{ transaction: t }
					);

					// Применяем эффекты события
					if (newEvent.effects) {
						for (const [key, value] of Object.entries(
							newEvent.effects
						)) {
							if (userEventSettings.eventMultipliers[key]) {
								userEventSettings.eventMultipliers[key] *=
									value;
							}
						}
						await userEventSettings.save({ transaction: t });
					}

					triggeredEvents.push({
						...newEvent.toJSON(),
						event: event.toJSON(),
					});
				}
			}

			// Обновляем кулдауны для сработавших событий
			for (const event of triggeredEvents) {
				const gameEvent = availableEvents.find(
					(e) => e.id === event.eventId
				);
				if (gameEvent) {
					const cooldownKey = `${gameEvent.id}_${gameEvent.type}`;
					userEventSettings.eventCooldowns[cooldownKey] = now;
				}
			}

			// Обновляем время последней проверки
			userEventSettings.lastEventCheck = now;
			await userEventSettings.save({ transaction: t });

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				const activeEventCount = await UserEvent.count({
					where: {
						userId,
						status: 'ACTIVE',
					},
					transaction: t,
				});

				userState.state.ownedEventsCount = activeEventCount;
				await userState.save({ transaction: t });
			}

			await t.commit();

			// Получаем обновленные активные события
			const updatedActiveEvents = await this.getActiveEvents(userId);

			return {
				activeEvents: updatedActiveEvents,
				eventMultipliers: userEventSettings.eventMultipliers,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal('Failed to check events: ' + err.message);
		}
	}

	async shouldEventTrigger(
		event,
		userId,
		now,
		userEventSettings,
		transaction
	) {
		// Проверяем кулдауны
		const cooldownKey = `${event.id}_${event.type}`;
		const lastTriggerTime = userEventSettings.eventCooldowns[cooldownKey];
		if (
			lastTriggerTime &&
			now - new Date(lastTriggerTime) < (event.frequency?.cooldown || 0)
		) {
			return false;
		}

		// Проверяем предпочтения пользователя
		if (userEventSettings.disabledEvents.includes(event.id)) {
			return false;
		}

		// Проверяем, включен ли тип события
		if (
			userEventSettings.enabledTypes &&
			!userEventSettings.enabledTypes.includes(event.type)
		) {
			return false;
		}

		// Проверяем, не активно ли уже это событие
		const activeEvent = await UserEvent.findOne({
			where: {
				userId,
				eventId: event.id,
				status: 'ACTIVE',
			},
			transaction,
		});

		if (activeEvent) {
			return false;
		}

		// Проверяем историю событий для этого конкретного события
		const eventHistory = await UserEvent.findAll({
			where: {
				userId,
				eventId: event.id,
			},
			order: [['triggeredAt', 'DESC']],
			limit: 1,
			transaction,
		});

		const lastEvent = eventHistory.length > 0 ? eventHistory[0] : null;

		switch (event.type) {
			case 'RANDOM': {
				const timeSinceLastCheck =
					now - userEventSettings.lastEventCheck;
				const chance =
					(timeSinceLastCheck / 1000) *
					(event.frequency?.chancePerSecond || 0);
				return Math.random() < chance;
			}
			case 'PERIODIC': {
				if (!lastEvent) return true;
				const timeSinceLastOccurrence =
					now - new Date(lastEvent.triggeredAt);
				return (
					timeSinceLastOccurrence >= (event.frequency?.interval || 0)
				);
			}
			case 'ONE_TIME':
				return !lastEvent;
			case 'CONDITIONAL': {
				const cond = event.triggerConfig?.condition;
				if (!cond) return false;

				// Получаем состояние пользователя для проверки условий
				const userState = await UserState.findOne({
					where: { userId },
					transaction,
				});

				if (!userState) return false;

				// Проверяем условие на основе метрики
				const metricValue =
					cond.metric === 'chaosLevel'
						? userState.chaosLevel
						: cond.metric === 'stabilityLevel'
						? userState.stabilityLevel
						: cond.metric === 'entropyVelocity'
						? userState.entropyVelocity
						: userState.state?.[cond.metric];

				if (metricValue === undefined) return false;

				switch (cond.op) {
					case '>':
						return metricValue > cond.value;
					case '<':
						return metricValue < cond.value;
					case '>=':
						return metricValue >= cond.value;
					case '<=':
						return metricValue <= cond.value;
					case '==':
						return metricValue == cond.value;
					case '!=':
						return metricValue != cond.value;
					default:
						return false;
				}
			}
			case 'CHAINED': {
				if (!event.triggerConfig?.after) return false;

				// Проверяем, завершено ли предыдущее событие в цепочке
				const previousEvent = await UserEvent.findOne({
					where: {
						userId,
						eventId: event.triggerConfig.after,
						status: {
							[Op.in]: ['COMPLETED', 'EXPIRED'],
						},
					},
					transaction,
				});

				return !!previousEvent;
			}
			case 'TRIGGERED_BY_ACTION':
				// Эти события триггерятся вручную, поэтому здесь всегда возвращаем false
				return false;
			case 'GLOBAL_TIMED': {
				const targetTime = new Date(event.triggerConfig?.at);
				// Событие срабатывает, если текущее время больше целевого,
				// и событие еще не было активировано
				return now >= targetTime && !lastEvent;
			}
			case 'LIMITED_REPEATABLE': {
				if (!lastEvent) return true;

				// Проверяем, не превышено ли максимальное количество повторений
				const repeatCount = await UserEvent.count({
					where: {
						userId,
						eventId: event.id,
					},
					transaction,
				});

				return repeatCount < (event.triggerConfig?.maxRepeats || 1);
			}
			case 'SEASONAL': {
				const start = new Date(event.triggerConfig?.start);
				const end = new Date(event.triggerConfig?.end);

				// Событие активно, если текущая дата в пределах сезона
				return now >= start && now <= end;
			}
			case 'PASSIVE':
				// Пассивные события всегда активны, если не указано иное
				return true;
			default:
				return false;
		}
	}

	async getActiveEvents(userId) {
		const t = await sequelize.transaction();

		try {
			// Получаем все активные события пользователя с информацией о событиях
			const activeEvents = await UserEvent.findAll({
				where: {
					userId,
					status: 'ACTIVE',
				},
				include: [
					{
						model: GameEvent,
						attributes: [
							'id',
							'name',
							'description',
							'type',
							'triggerConfig',
							'effect',
							'frequency',
							'conditions',
							'active',
						],
					},
				],
				transaction: t,
			});

			const result = activeEvents.map((userEvent) => ({
				id: userEvent.id,
				userId: userEvent.userId,
				eventId: userEvent.eventId,
				status: userEvent.status,
				triggeredAt: userEvent.triggeredAt,
				expiresAt: userEvent.expiresAt,
				effects: userEvent.effects,
				progress: userEvent.progress,
				completedAt: userEvent.completedAt,
				event: userEvent.gameevent,
			}));

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get active events: ${err.message}`
			);
		}
	}

	async initializeUserEvents(userId) {
		const t = await sequelize.transaction();

		try {
			// Создаем настройки событий пользователя, если они не существуют
			let userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				userEventSettings = await UserEventSetting.create(
					{
						userId,
						eventMultipliers: {
							production: 1.0,
							chaos: 1.0,
							stability: 1.0,
							entropy: 1.0,
							rewards: 1.0,
						},
						lastEventCheck: new Date(),
						eventCooldowns: {},
						enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
						disabledEvents: [],
						priorityEvents: [],
					},
					{ transaction: t }
				);
			}

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				userState.state.ownedEventsCount = 0;
				await userState.save({ transaction: t });
			}

			await t.commit();
			return userEventSettings;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to initialize user events: ${err.message}`
			);
		}
	}

	async getUserEvents(userId) {
		const t = await sequelize.transaction();

		try {
			// Получаем все события пользователя с информацией о событиях
			const userEvents = await UserEvent.findAll({
				where: { userId },
				include: [
					{
						model: GameEvent,
						attributes: [
							'id',
							'name',
							'description',
							'type',
							'triggerConfig',
							'effect',
							'frequency',
							'conditions',
							'active',
						],
					},
				],
				transaction: t,
			});

			// Получаем настройки событий пользователя
			const userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			const result = {
				events: userEvents.map((userEvent) => ({
					id: userEvent.id,
					userId: userEvent.userId,
					eventId: userEvent.eventId,
					status: userEvent.status,
					triggeredAt: userEvent.triggeredAt,
					expiresAt: userEvent.expiresAt,
					effects: userEvent.effects,
					progress: userEvent.progress,
					completedAt: userEvent.completedAt,
					event: userEvent.gameevent,
				})),
				settings: userEventSettings,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user events: ${err.message}`
			);
		}
	}

	async updateEventProgress(userId, eventId, progress) {
		const t = await sequelize.transaction();

		try {
			// Находим событие пользователя
			const userEvent = await UserEvent.findOne({
				where: {
					userId,
					id: eventId,
				},
				transaction: t,
			});

			if (!userEvent) {
				await t.rollback();
				throw ApiError.BadRequest('User event not found');
			}

			// Если событие не активно, ничего не делаем
			if (userEvent.status !== 'ACTIVE') {
				await t.rollback();
				return userEvent;
			}

			// Обновляем прогресс
			userEvent.progress = {
				...userEvent.progress,
				...progress,
			};

			await userEvent.save({ transaction: t });

			await t.commit();
			return userEvent;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update event progress: ${err.message}`
			);
		}
	}

	async completeEvent(userId, eventId) {
		const t = await sequelize.transaction();

		try {
			// Находим событие пользователя
			const userEvent = await UserEvent.findOne({
				where: {
					userId,
					id: eventId,
				},
				include: [
					{
						model: GameEvent,
						attributes: [
							'id',
							'name',
							'description',
							'type',
							'triggerConfig',
							'effect',
							'frequency',
							'conditions',
							'active',
						],
					},
				],
				transaction: t,
			});

			if (!userEvent) {
				await t.rollback();
				throw ApiError.BadRequest('User event not found');
			}

			// Если событие не активно, ничего не делаем
			if (userEvent.status !== 'ACTIVE') {
				await t.rollback();
				return userEvent;
			}

			// Помечаем событие как завершенное
			userEvent.status = 'COMPLETED';
			userEvent.completedAt = new Date();
			await userEvent.save({ transaction: t });

			// Проверяем, есть ли награда за событие
			if (
				userEvent.gameevent &&
				userEvent.gameevent.effect &&
				userEvent.gameevent.effect.reward
			) {
				const reward = userEvent.gameevent.effect.reward.amount || 0;
				const rewardType =
					userEvent.gameevent.effect.reward.type || 'stardust';

				// Регистрируем награду через marketService
				await marketService.registerEventReward({
					userId,
					eventId: userEvent.eventId,
					amount: reward,
					currency: rewardType,
				});
			}

			// Удаляем эффекты завершенного события
			const userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (userEventSettings && userEvent.effects) {
				for (const [key, value] of Object.entries(userEvent.effects)) {
					if (userEventSettings.eventMultipliers[key]) {
						userEventSettings.eventMultipliers[key] /= value;
					}
				}
				await userEventSettings.save({ transaction: t });
			}

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				const activeEventCount = await UserEvent.count({
					where: {
						userId,
						status: 'ACTIVE',
					},
					transaction: t,
				});

				userState.state.ownedEventsCount = activeEventCount;
				await userState.save({ transaction: t });
			}

			await t.commit();
			return userEvent;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to complete event: ${err.message}`);
		}
	}

	async cancelEvent(userId, eventId) {
		const t = await sequelize.transaction();

		try {
			// Находим событие пользователя
			const userEvent = await UserEvent.findOne({
				where: {
					userId,
					id: eventId,
				},
				transaction: t,
			});

			if (!userEvent) {
				await t.rollback();
				throw ApiError.BadRequest('User event not found');
			}

			// Если событие не активно, ничего не делаем
			if (userEvent.status !== 'ACTIVE') {
				await t.rollback();
				return userEvent;
			}

			// Помечаем событие как отмененное
			userEvent.status = 'CANCELLED';
			await userEvent.save({ transaction: t });

			// Удаляем эффекты отмененного события
			const userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (userEventSettings && userEvent.effects) {
				for (const [key, value] of Object.entries(userEvent.effects)) {
					if (userEventSettings.eventMultipliers[key]) {
						userEventSettings.eventMultipliers[key] /= value;
					}
				}
				await userEventSettings.save({ transaction: t });
			}

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				const activeEventCount = await UserEvent.count({
					where: {
						userId,
						status: 'ACTIVE',
					},
					transaction: t,
				});

				userState.state.ownedEventsCount = activeEventCount;
				await userState.save({ transaction: t });
			}

			await t.commit();
			return userEvent;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to cancel event: ${err.message}`);
		}
	}

	async updateEventSettings(userId, settings) {
		const t = await sequelize.transaction();

		try {
			// Получаем настройки событий пользователя
			let userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				userEventSettings = await UserEventSetting.create(
					{
						userId,
						eventMultipliers: {
							production: 1.0,
							chaos: 1.0,
							stability: 1.0,
							entropy: 1.0,
							rewards: 1.0,
						},
						lastEventCheck: new Date(),
						eventCooldowns: {},
						enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
						disabledEvents: [],
						priorityEvents: [],
						...settings,
					},
					{ transaction: t }
				);
			} else {
				await userEventSettings.update(settings, { transaction: t });
			}

			await t.commit();
			return userEventSettings;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update event settings: ${err.message}`
			);
		}
	}

	async getUserEvent(userId, eventId) {
		const t = await sequelize.transaction();

		try {
			const userEvent = await UserEvent.findOne({
				where: {
					userId,
					id: eventId,
				},
				include: [
					{
						model: GameEvent,
						attributes: [
							'id',
							'name',
							'description',
							'type',
							'triggerConfig',
							'effect',
							'frequency',
							'conditions',
							'active',
						],
					},
				],
				transaction: t,
			});

			if (!userEvent) {
				await t.rollback();
				throw ApiError.BadRequest('User event not found');
			}

			const result = {
				id: userEvent.id,
				userId: userEvent.userId,
				eventId: userEvent.eventId,
				status: userEvent.status,
				triggeredAt: userEvent.triggeredAt,
				expiresAt: userEvent.expiresAt,
				effects: userEvent.effects,
				progress: userEvent.progress,
				event: userEvent.gameevent,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get user event: ${err.message}`);
		}
	}

	async getUserEventSettings(userId) {
		const t = await sequelize.transaction();

		try {
			let userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				// Create default settings if they don't exist
				userEventSettings = await UserEventSetting.create(
					{
						userId,
						eventMultipliers: {
							production: 1.0,
							chaos: 1.0,
							stability: 1.0,
							entropy: 1.0,
							rewards: 1.0,
						},
						lastEventCheck: new Date(),
						eventCooldowns: {},
						enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
						disabledEvents: [],
						priorityEvents: [],
					},
					{ transaction: t }
				);
			}

			await t.commit();
			return userEventSettings;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user event settings: ${err.message}`
			);
		}
	}

	async updateUserEventSettings(userId, settings) {
		const t = await sequelize.transaction();

		try {
			let userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				// Create default settings if they don't exist
				userEventSettings = await UserEventSetting.create(
					{
						userId,
						eventMultipliers: {
							production: 1.0,
							chaos: 1.0,
							stability: 1.0,
							entropy: 1.0,
							rewards: 1.0,
						},
						lastEventCheck: new Date(),
						eventCooldowns: {},
						enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
						disabledEvents: [],
						priorityEvents: [],
					},
					{ transaction: t }
				);
			}

			// Update settings
			if (settings.enabledTypes !== undefined) {
				userEventSettings.enabledTypes = settings.enabledTypes;
			}

			if (settings.disabledEvents !== undefined) {
				userEventSettings.disabledEvents = settings.disabledEvents;
			}

			if (settings.priorityEvents !== undefined) {
				userEventSettings.priorityEvents = settings.priorityEvents;
			}

			if (settings.eventMultipliers !== undefined) {
				userEventSettings.eventMultipliers = {
					...userEventSettings.eventMultipliers,
					...settings.eventMultipliers,
				};
			}

			await userEventSettings.save({ transaction: t });
			await t.commit();

			return userEventSettings;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update user event settings: ${err.message}`
			);
		}
	}

	async getUserEventStats(userId) {
		const t = await sequelize.transaction();

		try {
			// Get all user events
			const userEvents = await UserEvent.findAll({
				where: { userId },
				transaction: t,
			});

			// Get event settings
			const eventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			// Calculate statistics
			const totalEvents = userEvents.length;
			const activeEvents = userEvents.filter(
				(event) => event.status === 'ACTIVE'
			).length;
			const expiredEvents = userEvents.filter(
				(event) => event.status === 'EXPIRED'
			).length;
			const cancelledEvents = userEvents.filter(
				(event) => event.status === 'CANCELLED'
			).length;

			// Calculate stats by type
			const eventIds = userEvents.map((event) => event.eventId);
			const gameEvents = await GameEvent.findAll({
				where: {
					id: {
						[Op.in]: eventIds,
					},
				},
				transaction: t,
			});

			const typeMap = {};
			for (const event of userEvents) {
				const gameEvent = gameEvents.find(
					(ge) => ge.id === event.eventId
				);
				if (!gameEvent) continue;

				const type = gameEvent.type;
				if (!typeMap[type]) {
					typeMap[type] = {
						total: 0,
						active: 0,
						expired: 0,
						cancelled: 0,
					};
				}

				typeMap[type].total++;
				if (event.status === 'ACTIVE') {
					typeMap[type].active++;
				} else if (event.status === 'EXPIRED') {
					typeMap[type].expired++;
				} else if (event.status === 'CANCELLED') {
					typeMap[type].cancelled++;
				}
			}

			// Calculate multipliers
			const multipliers = eventSettings?.eventMultipliers || {
				production: 1.0,
				chaos: 1.0,
				stability: 1.0,
				entropy: 1.0,
				rewards: 1.0,
			};

			await t.commit();

			return {
				total: totalEvents,
				active: activeEvents,
				expired: expiredEvents,
				cancelled: cancelledEvents,
				byType: typeMap,
				multipliers,
				lastEventCheck: eventSettings?.lastEventCheck || new Date(),
				enabledTypes: eventSettings?.enabledTypes || [],
				disabledEvents: eventSettings?.disabledEvents || [],
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user event stats: ${err.message}`
			);
		}
	}
}

module.exports = new EventService();
