const { GameEvent, UserEventState, UserState } = require('../models/models');
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
			const userEventState = await UserEventState.findOne({
				where: { userId },
			});

			if (!userEventState) {
				throw ApiError.BadRequest('User event state not found');
			}

			const now = new Date();
			const activeEvents = [...userEventState.activeEvents];
			let multipliers = { ...userEventState.multipliers };
			const eventHistory = [...userEventState.eventHistory];

			// Remove expired events
			const updatedActiveEvents = activeEvents.filter((event) => {
				if (new Date(event.expiresAt) <= now) {
					// Remove effect when event expires
					if (event.effect.type === 'CPS_MULTIPLIER') {
						multipliers.cps /= event.effect.value;
					}
					return false;
				}
				return true;
			});

			// Get all active events from database
			const availableEvents = await GameEvent.findAll({
				where: { active: true },
			});

			for (const event of availableEvents) {
				const shouldTrigger = await this.shouldEventTrigger(
					event,
					userEventState,
					now
				);

				if (shouldTrigger) {
					const triggeredEvent = this.triggerEvent(event, now);
					updatedActiveEvents.push(triggeredEvent);

					// Apply event effect
					if (triggeredEvent.effect.type === 'CPS_MULTIPLIER') {
						multipliers.cps *= triggeredEvent.effect.value;
					}

					eventHistory.push({
						eventId: event.id,
						triggeredAt: now,
						effect: triggeredEvent.effect,
					});
				}
			}

			// Update user event state
			userEventState.activeEvents = updatedActiveEvents;
			userEventState.multipliers = multipliers;
			userEventState.eventHistory = eventHistory;
			userEventState.lastCheck = now;
			await userEventState.save();

			return {
				activeEvents: updatedActiveEvents,
				multipliers,
				eventHistory,
			};
		} catch (err) {
			throw ApiError.Internal('Failed to check events: ' + err.message);
		}
	}

	async shouldEventTrigger(event, userEventState, now) {
		const lastCheck = new Date(userEventState.lastCheck);
		const timeDiff = now - lastCheck;

		switch (event.type) {
			case 'RANDOM':
				// Check if event should trigger based on frequency
				const chance =
					(timeDiff / 1000) * (event.frequency.chancePerSecond || 0);
				return Math.random() < chance;

			case 'PERIODIC':
				// Check if enough time has passed since last occurrence
				const lastOccurrence = userEventState.eventHistory
					.filter((h) => h.eventId === event.id)
					.sort(
						(a, b) =>
							new Date(b.triggeredAt) - new Date(a.triggeredAt)
					)[0];

				if (!lastOccurrence) return true;

				const timeSinceLastOccurrence =
					now - new Date(lastOccurrence.triggeredAt);
				return timeSinceLastOccurrence >= event.frequency.interval;

			case 'ONE_TIME':
				// Check if event has never occurred before
				return !userEventState.eventHistory.some(
					(h) => h.eventId === event.id
				);

			default:
				return false;
		}
	}

	triggerEvent(event, now) {
		const duration = event.effect.duration || 0;
		return {
			id: event.id,
			name: event.name,
			description: event.description,
			effect: event.effect,
			triggeredAt: now,
			expiresAt: new Date(now.getTime() + duration * 1000),
		};
	}

	async getActiveEvents(userId) {
		try {
			const userEventState = await UserEventState.findOne({
				where: { userId },
			});

			if (!userEventState) {
				throw ApiError.BadRequest('User event state not found');
			}

			return {
				activeEvents: userEventState.activeEvents,
				multipliers: userEventState.multipliers,
			};
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to get active events: ' + err.message
			);
		}
	}
}

module.exports = new EventService();
