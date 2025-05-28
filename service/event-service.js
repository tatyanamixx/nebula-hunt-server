const {
	GameEvent,
	UserEventState,
	UserState,
	UserEvent,
} = require('../models/models');
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
				include: [
					{
						model: UserEvent,
						include: [GameEvent],
						where: {
							userId,
							status: 'ACTIVE',
						},
						required: false,
					},
				],
			});

			if (!userEventState) {
				throw ApiError.BadRequest('User event state not found');
			}

			const now = new Date();
			let multipliers = { cps: 1.0 };

			// Update expired events
			for (const userEvent of userEventState.UserEvents) {
				if (new Date(userEvent.expiresAt) <= now) {
					await userEvent.update({ status: 'EXPIRED' });
				} else {
					// Apply active event effects
					if (userEvent.GameEvent.effect.type === 'CPS_MULTIPLIER') {
						multipliers.cps *= userEvent.effectValue;
					}
				}
			}

			// Get all active events from database
			const availableEvents = await GameEvent.findAll({
				where: { active: true },
			});

			// Check and trigger new events
			for (const event of availableEvents) {
				const shouldTrigger = await this.shouldEventTrigger(
					event,
					userEventState,
					now
				);

				if (shouldTrigger) {
					const duration = event.effect.duration || 0;
					const expiresAt = new Date(now.getTime() + duration * 1000);

					const userEvent = await UserEvent.create({
						userId,
						userEventStateId: userEventState.id,
						gameEventId: event.id,
						triggeredAt: now,
						expiresAt: duration > 0 ? expiresAt : null,
						effectValue: event.effect.value || 1.0,
						status: 'ACTIVE',
					});

					// Apply new event effect
					if (event.effect.type === 'CPS_MULTIPLIER') {
						multipliers.cps *= userEvent.effectValue;
					}
				}
			}

			// Update multipliers in user event state
			await userEventState.update({ multipliers });

			// Fetch updated active events
			const activeEvents = await UserEvent.findAll({
				where: {
					userId,
					userEventStateId: userEventState.id,
					status: 'ACTIVE',
				},
				include: [GameEvent],
			});

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
			throw ApiError.Internal('Failed to check events: ' + err.message);
		}
	}

	async shouldEventTrigger(event, userEventState, now) {
		// Get all user events for this game event
		const userEvents = await UserEvent.findAll({
			where: {
				userId: userEventState.userId,
				gameEventId: event.id,
			},
		});

		const lastCheck = userEventState.lastCheck;
		const timeDiff = now - lastCheck;

		switch (event.type) {
			case 'RANDOM':
				const chance =
					(timeDiff / 1000) * (event.frequency.chancePerSecond || 0);
				return Math.random() < chance;

			case 'PERIODIC':
				const lastOccurrence = userEvents.sort(
					(a, b) => b.triggeredAt - a.triggeredAt
				)[0];

				if (!lastOccurrence) return true;

				const timeSinceLastOccurrence =
					now - lastOccurrence.triggeredAt;
				return timeSinceLastOccurrence >= event.frequency.interval;

			case 'ONE_TIME':
				return userEvents.length === 0;

			default:
				return false;
		}
	}

	async getActiveEvents(userId) {
		try {
			const userEventState = await UserEventState.findOne({
				where: { userId },
				include: [
					{
						model: UserEvent,
						include: [GameEvent],
						where: {
							userId,
							status: 'ACTIVE',
						},
						required: false,
					},
				],
			});

			if (!userEventState) {
				throw ApiError.BadRequest('User event state not found');
			}

			return {
				activeEvents: userEventState.UserEvents.map((ue) => ({
					id: ue.GameEvent.id,
					name: ue.GameEvent.name,
					description: ue.GameEvent.description,
					effect: ue.GameEvent.effect,
					triggeredAt: ue.triggeredAt,
					expiresAt: ue.expiresAt,
				})),
				multipliers: userEventState.multipliers,
			};
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to get active events: ' + err.message
			);
		}
	}

	async initializeUserEvents(userId) {
		try {
			let userEventState = await UserEventState.findOne({
				where: { userId },
			});

			if (userEventState) {
				return userEventState;
			}

			userEventState = await UserEventState.create({
				userId,
				multipliers: { cps: 1.0 },
				lastCheck: new Date(),
			});

			const now = new Date();
			const initialEvents = await GameEvent.findAll({
				where: {
					type: 'ONE_TIME',
					active: true,
				},
			});

			for (const event of initialEvents) {
				if (await this.shouldEventTrigger(event, userEventState, now)) {
					const duration = event.effect.duration || 0;
					const expiresAt = new Date(now.getTime() + duration * 1000);

					await UserEvent.create({
						userId,
						userEventStateId: userEventState.id,
						gameEventId: event.id,
						triggeredAt: now,
						expiresAt: duration > 0 ? expiresAt : null,
						effectValue: event.effect.value || 1.0,
						status: 'ACTIVE',
					});

					if (event.effect.type === 'CPS_MULTIPLIER') {
						userEventState.multipliers.cps *= event.effect.value;
					}
				}
			}

			await userEventState.save();
			return userEventState;
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to initialize user events: ' + err.message
			);
		}
	}
}

module.exports = new EventService();
