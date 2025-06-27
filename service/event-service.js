const { GameEvent, UserState, UserEvent } = require('../models/models');
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
			let multipliers = { cps: 1.0 };

			// Получаем все активные события пользователя
			const activeEvents = await UserEvent.findAll({
				where: { userId, status: 'ACTIVE' },
				include: [GameEvent],
			});

			// Обновляем истёкшие события
			for (const userEvent of activeEvents) {
				if (
					userEvent.expiresAt &&
					new Date(userEvent.expiresAt) <= now
				) {
					await userEvent.update({ status: 'EXPIRED' });
				} else {
					if (userEvent.GameEvent.effect.type === 'CPS_MULTIPLIER') {
						multipliers.cps *= userEvent.effectValue;
					}
				}
			}

			// Получаем все доступные события
			const availableEvents = await GameEvent.findAll({
				where: { active: true },
			});

			// Проверяем и триггерим новые события
			for (const event of availableEvents) {
				const shouldTrigger = await this.shouldEventTrigger(
					event,
					userId,
					now
				);
				if (shouldTrigger) {
					const duration = event.effect.duration || 0;
					const expiresAt = new Date(now.getTime() + duration * 1000);
					const userEvent = await UserEvent.create({
						userId,
						gameEventId: event.id,
						triggeredAt: now,
						expiresAt: duration > 0 ? expiresAt : null,
						effectValue: event.effect.value || 1.0,
						status: 'ACTIVE',
						lastCheck: now,
						multipliers,
					});
					if (event.effect.type === 'CPS_MULTIPLIER') {
						multipliers.cps *= userEvent.effectValue;
					}
				}
			}

			// Возвращаем актуальные события и мультипликаторы
			const updatedActiveEvents = await UserEvent.findAll({
				where: { userId, status: 'ACTIVE' },
				include: [GameEvent],
			});

			return {
				activeEvents: updatedActiveEvents.map((ue) => ({
					id: ue.GameEvent.id,
					name: ue.GameEvent.name,
					description: ue.GameEvent.description,
					effect: ue.GameEvent.effect,
					triggeredAt: ue.triggeredAt,
					expiresAt: ue.expiresAt,
				})),
				multipliers,
			};
		} catch (err) {
			throw ApiError.Internal('Failed to check events: ' + err.message);
		}
	}

	async shouldEventTrigger(event, userId, now) {
		const userEvents = await UserEvent.findAll({
			where: { userId, gameEventId: event.id },
		});
		const lastCheck =
			userEvents.length > 0
				? userEvents[userEvents.length - 1].lastCheck
				: now;
		const timeDiff = now - lastCheck;
		switch (event.type) {
			case 'RANDOM': {
				const chance =
					(timeDiff / 1000) * (event.frequency.chancePerSecond || 0);
				return Math.random() < chance;
			}
			case 'PERIODIC': {
				const lastOccurrence = userEvents.sort(
					(a, b) => b.triggeredAt - a.triggeredAt
				)[0];
				if (!lastOccurrence) return true;
				const timeSinceLastOccurrence =
					now - lastOccurrence.triggeredAt;
				return timeSinceLastOccurrence >= event.frequency.interval;
			}
			case 'ONE_TIME':
				return userEvents.length === 0;
			case 'CONDITIONAL': {
				// triggerConfig.condition: { metric, op, value }
				const cond = event.triggerConfig?.condition;
				if (!cond) return false;
				// Пример: metric = 'totalStars', op = '>', value = 1000
				const userState = await UserState.findOne({
					where: { userId },
				});
				const metricValue = userState?.state?.[cond.metric];
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
				// triggerConfig.after: eventId
				const afterId = event.triggerConfig?.after;
				if (!afterId) return false;
				const afterEvent = await UserEvent.findOne({
					where: {
						userId,
						gameEventId: afterId,
						status: 'COMPLETED',
					},
				});
				return !!afterEvent;
			}
			case 'TRIGGERED_BY_ACTION':
				// Только вручную, не триггерим автоматически
				return false;
			case 'GLOBAL_TIMED': {
				// triggerConfig.at: дата/время
				const at = event.triggerConfig?.at;
				if (!at) return false;
				return now >= new Date(at);
			}
			case 'LIMITED_REPEATABLE': {
				// triggerConfig.limit: число
				const limit = event.triggerConfig?.limit;
				if (!limit) return false;
				return userEvents.length < limit;
			}
			case 'SEASONAL': {
				// triggerConfig.start, triggerConfig.end: даты
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
			const activeEvents = await UserEvent.findAll({
				where: { userId, status: 'ACTIVE' },
				include: [GameEvent],
			});
			const multipliers = activeEvents.reduce(
				(acc, ue) => {
					if (ue.GameEvent.effect.type === 'CPS_MULTIPLIER') {
						acc.cps *= ue.effectValue;
					}
					return acc;
				},
				{ cps: 1.0 }
			);
			return {
				activeEvents: activeEvents.map((ue) => ({
					id: ue.GameEvent.id,
					name: ue.GameEvent.name,
					description: ue.GameEvent.description,
					effect: ue.GameEvent.effect,
					triggeredAt: ue.triggeredAt,
					expiresAt: ue.expiresAt,
				})),
				multipliers,
			};
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to get active events: ' + err.message
			);
		}
	}

	async initializeUserEvents(userId) {
		try {
			const now = new Date();
			const initialEvents = await GameEvent.findAll({
				where: { type: 'ONE_TIME', active: true },
			});
			let multipliers = { cps: 1.0 };
			for (const event of initialEvents) {
				const shouldTrigger = await this.shouldEventTrigger(
					event,
					userId,
					now
				);
				if (shouldTrigger) {
					const duration = event.effect.duration || 0;
					const expiresAt = new Date(now.getTime() + duration * 1000);
					await UserEvent.create({
						userId,
						gameEventId: event.id,
						triggeredAt: now,
						expiresAt: duration > 0 ? expiresAt : null,
						effectValue: event.effect.value || 1.0,
						status: 'ACTIVE',
						lastCheck: now,
						multipliers,
					});
					if (event.effect.type === 'CPS_MULTIPLIER') {
						multipliers.cps *= event.effect.value;
					}
				}
			}
			return true;
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to initialize user events: ' + err.message
			);
		}
	}
}

module.exports = new EventService();
