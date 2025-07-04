const { GameEvent, UserState } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { Op } = require('sequelize');

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
		try {
			const event = await GameEvent.create(eventData);
			return event;
		} catch (err) {
			throw ApiError.BadRequest('Failed to create event: ' + err.message);
		}
	}

	async checkAndTriggerEvents(userId) {
		try {
			const now = new Date();

			// Получаем состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля событий, если их нет
			if (!userState.activeEvents) userState.activeEvents = [];
			if (!userState.eventMultipliers) {
				userState.eventMultipliers = {
					production: 1.0,
					chaos: 1.0,
					stability: 1.0,
					entropy: 1.0,
					rewards: 1.0,
				};
			}
			if (!userState.eventCooldowns) userState.eventCooldowns = {};

			// Получаем все доступные события
			const availableEvents = await GameEvent.findAll({
				where: { active: true },
			});

			// Проверяем и триггерим новые события
			for (const event of availableEvents) {
				const shouldTrigger = await this.shouldEventTrigger(
					event,
					userId,
					now,
					userState
				);

				if (shouldTrigger) {
					const duration = event.effect.duration || 0;
					const expiresAt =
						duration > 0
							? new Date(now.getTime() + duration * 1000)
							: null;

					const newEvent = {
						id: event.id,
						name: event.name,
						description: event.description,
						type: event.type,
						triggeredAt: now,
						expiresAt: expiresAt,
						effects: event.effect.multipliers || {},
						progress: {},
						status: 'ACTIVE',
					};

					// Применяем эффекты события
					if (newEvent.effects) {
						Object.keys(newEvent.effects).forEach((key) => {
							if (userState.eventMultipliers[key]) {
								userState.eventMultipliers[key] *=
									newEvent.effects[key];
							}
						});
					}

					userState.activeEvents.push(newEvent);
				}
			}

			// Обновляем кулдауны для сработавших событий
			for (const event of availableEvents) {
				if (
					userState.activeEvents.some(
						(ae) => ae.id === event.id && ae.triggeredAt === now
					)
				) {
					const cooldownKey = `${event.id}_${event.type}`;
					userState.eventCooldowns[cooldownKey] = now;
				}
			}

			// Обновляем время последней проверки
			userState.lastEventCheck = now;
			await userState.save();

			return {
				activeEvents: userState.activeEvents,
				eventMultipliers: userState.eventMultipliers,
			};
		} catch (err) {
			throw ApiError.Internal('Failed to check events: ' + err.message);
		}
	}

	async shouldEventTrigger(event, userId, now, userState) {
		// Проверяем кулдауны
		const cooldownKey = `${event.id}_${event.type}`;
		const lastTriggerTime = userState.eventCooldowns[cooldownKey];
		if (
			lastTriggerTime &&
			now - new Date(lastTriggerTime) < (event.frequency?.cooldown || 0)
		) {
			return false;
		}

		// Проверяем предпочтения пользователя
		if (userState.eventPreferences?.disabledEvents?.includes(event.id)) {
			return false;
		}

		// Проверяем, включен ли тип события
		if (
			userState.eventPreferences?.enabledTypes &&
			!userState.eventPreferences.enabledTypes.includes(event.type)
		) {
			return false;
		}

		// Проверяем историю событий для этого конкретного события
		const eventHistory = userState.eventHistory.filter(
			(e) => e.id === event.id
		);
		const lastEvent =
			eventHistory.length > 0
				? eventHistory[eventHistory.length - 1]
				: null;

		switch (event.type) {
			case 'RANDOM': {
				const timeSinceLastCheck = now - userState.lastEventCheck;
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
				return eventHistory.length === 0;
			case 'CONDITIONAL': {
				const cond = event.triggerConfig?.condition;
				if (!cond) return false;

				// Поддерживаем различные метрики
				let metricValue;
				switch (cond.metric) {
					case 'totalStars':
						metricValue = userState.state?.totalStars;
						break;
					case 'chaosLevel':
						metricValue = userState.chaosLevel;
						break;
					case 'stabilityLevel':
						metricValue = userState.stabilityLevel;
						break;
					case 'entropyVelocity':
						metricValue = userState.entropyVelocity;
						break;
					default:
						metricValue = userState.state?.[cond.metric];
				}

				if (metricValue === undefined) return false;

				const ops = {
					'>': (a, b) => a > b,
					'>=': (a, b) => a >= b,
					'<': (a, b) => a < b,
					'<=': (a, b) => a <= b,
					'==': (a, b) => a == b,
					'===': (a, b) => a === b,
					'!=': (a, b) => a != b,
					'!==': (a, b) => a !== b,
				};
				return ops[cond.op]?.(metricValue, cond.value) ?? false;
			}
			case 'CHAINED': {
				const afterId = event.triggerConfig?.after;
				if (!afterId) return false;
				const afterEvent = userState.eventHistory.find(
					(e) => e.id === afterId && e.status === 'COMPLETED'
				);
				return !!afterEvent;
			}
			case 'TRIGGERED_BY_ACTION':
				// Только вручную, не триггерим автоматически
				return false;
			case 'GLOBAL_TIMED': {
				const at = event.triggerConfig?.at;
				if (!at) return false;
				return now >= new Date(at);
			}
			case 'LIMITED_REPEATABLE': {
				const limit = event.triggerConfig?.limit;
				if (!limit) return false;
				return eventHistory.length < limit;
			}
			case 'SEASONAL': {
				const start = event.triggerConfig?.start;
				const end = event.triggerConfig?.end;
				if (!start || !end) return false;
				const startDate = new Date(start);
				const endDate = new Date(end);
				return now >= startDate && now <= endDate;
			}
			case 'PASSIVE':
				// Не триггерим автоматически
				return false;
			default:
				return false;
		}
	}

	async getActiveEvents(userId) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			return {
				activeEvents: userState.activeEvents || [],
				eventMultipliers: userState.eventMultipliers || {
					production: 1.0,
					chaos: 1.0,
					stability: 1.0,
					entropy: 1.0,
					rewards: 1.0,
				},
			};
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to get active events: ' + err.message
			);
		}
	}

	async initializeUserEvents(userId) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля событий
			userState.activeEvents = [];
			userState.eventMultipliers = {
				production: 1.0,
				chaos: 1.0,
				stability: 1.0,
				entropy: 1.0,
				rewards: 1.0,
			};
			userState.lastEventCheck = new Date();
			userState.eventCooldowns = {};
			userState.eventPreferences = {
				enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
				disabledEvents: [],
				priorityEvents: [],
			};

			await userState.save();

			// Запускаем первую проверку событий
			await this.checkAndTriggerEvents(userId);

			return true;
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to initialize user events: ' + err.message
			);
		}
	}

	async getUserEvents(userId) {
		try {
			// Сначала проверяем и обновляем события
			const eventState = await this.checkAndTriggerEvents(userId);

			return {
				activeEvents: eventState.activeEvents,
				eventMultipliers: eventState.eventMultipliers,
			};
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to get user events: ' + err.message
			);
		}
	}
}

module.exports = new EventService();
