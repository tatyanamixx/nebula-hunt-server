/**
 * created by Claude on 15.07.2025
 */
const {
	EventTemplate,
	UserState,
	UserEvent,
	UserEventSetting,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');
const marketService = require('./market-service');

class EventService {
	/**
	 * Initialize events for a new user
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<Object>} Initialized user event settings
	 */
	async initializeUserEvents(userId, t) {
		try {
			const availableEvents = await EventTemplate.findAll({
				where: { active: true },
				transaction: t,
			});

			for (const event of availableEvents) {
				const userEvent = await UserEvent.findOrCreate({
					where: { userId, eventId: event.id },
					defaults: {
						userId,
						eventId: event.id,
						status: 'ACTIVE',
						triggeredAt: new Date(),
						expiresAt: null,
						effects: event.effect.multipliers || {},
					},
				});
			}

			// Create default event settings for the user
			const userEventSettings = await UserEventSetting.create(
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

			return userEventSettings;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to initialize user events: ${err.message}`
			);
		}
	}

	/**
	 * Check and trigger events for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Array>} Triggered events
	 */
	async checkAndTriggerEvents(userId) {
		const t = await sequelize.transaction();

		try {
			const userEvents = await this.initializeUserEvents(userId, t);
			logger.debug('userEvents', userEvents);
			
			const now = new Date();

			// Get or create user event settings
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

			// Get all available events
			const availableEvents = await EventTemplate.findAll({
				where: { active: true },
				transaction: t,
			});

			// Get active user events
			const activeUserEvents = await UserEvent.findAll({
				where: {
					userId,
					status: 'ACTIVE',
				},
				transaction: t,
			});

			// Check and update existing event statuses
			for (const userEvent of activeUserEvents) {
				// Check if event has expired
				if (userEvent.expiresAt && userEvent.expiresAt <= now) {
					userEvent.status = 'EXPIRED';
					await userEvent.save({ transaction: t });

					// Remove effects of expired event
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

			// Check and trigger new events
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

					// Apply event effects
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

			// Update last check time
			userEventSettings.lastEventCheck = now;
			await userEventSettings.save({ transaction: t });

			await t.commit();
			return { triggeredEvents, activeEvents: activeUserEvents };
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to check and trigger events: ${err.message}`
			);
		}
	}

	/**
	 * Check if an event should be triggered
	 * @param {Object} event - Event template
	 * @param {number} userId - User ID
	 * @param {Date} now - Current time
	 * @param {Object} userEventSettings - User event settings
	 * @param {Object} t - Transaction
	 * @returns {Promise<boolean>} Whether the event should be triggered
	 */
	async shouldEventTrigger(event, userId, now, userEventSettings, t) {
		// Check if event type is enabled
		if (!userEventSettings.enabledTypes.includes(event.type)) {
			return false;
		}

		// Check if event is in disabled list
		if (userEventSettings.disabledEvents.includes(event.id)) {
			return false;
		}

		// Check if event is on cooldown
		const cooldown = userEventSettings.eventCooldowns[event.id];
		if (cooldown && new Date(cooldown) > now) {
			return false;
		}

		// Check if event is already active
		const activeEvent = await UserEvent.findOne({
			where: {
				userId,
				eventId: event.id,
				status: 'ACTIVE',
			},
			transaction: t,
		});

		if (activeEvent) {
			return false;
		}

		// Check specific event type conditions
		switch (event.type) {
			case 'RANDOM':
				return this.checkRandomEventTrigger(event);
			case 'PERIODIC':
				return this.checkPeriodicEventTrigger(
					event,
					userEventSettings.lastEventCheck,
					now
				);
			case 'CONDITIONAL':
				return this.checkConditionalEventTrigger(event, userId, t);
			case 'RESOURCE_BASED':
				return this.checkResourceBasedEventTrigger(event, userId, t);
			case 'UPGRADE_DEPENDENT':
				return this.checkUpgradeDependentEventTrigger(event, userId, t);
			case 'TASK_DEPENDENT':
				return this.checkTaskDependentEventTrigger(event, userId, t);
			case 'MARKET_DEPENDENT':
				return this.checkMarketDependentEventTrigger(event, userId, t);
			default:
				return false;
		}
	}

	/**
	 * Check if a random event should be triggered
	 * @param {Object} event - Event template
	 * @returns {boolean} Whether the event should be triggered
	 */
	async checkRandomEventTrigger(event) {
		const chancePerHour = event.triggerConfig?.chancePerHour || 0.05;
		return Math.random() < chancePerHour / 60; // Convert to per-minute chance
	}

	/**
	 * Check if a periodic event should be triggered
	 * @param {Object} event - Event template
	 * @param {Date} lastTriggered - Last time events were checked
	 * @param {Date} now - Current time
	 * @returns {boolean} Whether the event should be triggered
	 */
	async checkPeriodicEventTrigger(event, lastTriggered, now) {
		const intervalStr = event.triggerConfig?.interval || '24h';
		const intervalMs = this.parseInterval(intervalStr);

		return now - new Date(lastTriggered) >= intervalMs;
	}

	/**
	 * Check if a conditional event should be triggered
	 * @param {Object} event - Event template
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<boolean>} Whether the event should be triggered
	 */
	async checkConditionalEventTrigger(event, userId, t) {
		// Check conditions from configuration
		const condition = event.triggerConfig?.condition;
		if (!condition) return false;

		// Here should be the logic to check the condition
		// For example, checking chaos level, resource amount, etc.
		return false; // Placeholder
	}

	/**
	 * Check if a resource-based event should be triggered
	 * @param {Object} event - Event template
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<boolean>} Whether the event should be triggered
	 */
	async checkResourceBasedEventTrigger(event, userId, t) {
		const { resource, threshold, operator } = event.triggerConfig || {};
		if (!resource || !threshold || !operator) return false;

		const userState = await UserState.findOne({
			where: { userId },
			transaction: t,
		});

		if (!userState || !userState[resource]) return false;

		switch (operator) {
			case '>':
				return userState[resource] > threshold;
			case '>=':
				return userState[resource] >= threshold;
			case '<':
				return userState[resource] < threshold;
			case '<=':
				return userState[resource] <= threshold;
			case '==':
				return userState[resource] == threshold;
			default:
				return false;
		}
	}

	/**
	 * Check if an upgrade-dependent event should be triggered
	 * @param {Object} event - Event template
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<boolean>} Whether the event should be triggered
	 */
	async checkUpgradeDependentEventTrigger(event, userId, t) {
		// Implementation for checking upgrade dependency
		return false; // Placeholder
	}

	/**
	 * Check if a task-dependent event should be triggered
	 * @param {Object} event - Event template
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<boolean>} Whether the event should be triggered
	 */
	async checkTaskDependentEventTrigger(event, userId, t) {
		// Implementation for checking task dependency
		return false; // Placeholder
	}

	/**
	 * Check if a market-dependent event should be triggered
	 * @param {Object} event - Event template
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<boolean>} Whether the event should be triggered
	 */
	async checkMarketDependentEventTrigger(event, userId, t) {
		// Implementation for checking market dependency
		return false; // Placeholder
	}

	/**
	 * Get all active events for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Array>} Active user events
	 */
	async getActiveUserEvents(userId) {
		const t = await sequelize.transaction();

		try {
			const activeEvents = await UserEvent.findAll({
				where: {
					userId,
					status: 'ACTIVE',
				},
				include: [
					{
						model: EventTemplate,
						attributes: [
							'id',
							'slug',
							'name',
							'description',
							'type',
							'effect',
						],
					},
				],
				transaction: t,
			});

			await t.commit();
			return activeEvents;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get active events: ${err.message}`
			);
		}
	}

	/**
	 * Get all events for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} User events
	 */
	async getAllUserEvents(userId) {
		const t = await sequelize.transaction();

		try {
			const [
				activeEvents,
				completedEvents,
				expiredEvents,
				userEventSettings,
			] = await Promise.all([
				UserEvent.findAll({
					where: {
						userId,
						status: 'ACTIVE',
					},
					include: [
						{
							model: EventTemplate,
							attributes: [
								'id',
								'slug',
								'name',
								'description',
								'type',
								'effect',
							],
						},
					],
					transaction: t,
				}),
				UserEvent.findAll({
					where: {
						userId,
						status: 'COMPLETED',
					},
					limit: 10,
					order: [['completedAt', 'DESC']],
					include: [
						{
							model: EventTemplate,
							attributes: ['id', 'slug', 'name', 'description', 'type'],
						},
					],
					transaction: t,
				}),
				UserEvent.findAll({
					where: {
						userId,
						status: 'EXPIRED',
					},
					limit: 10,
					order: [['expiresAt', 'DESC']],
					include: [
						{
							model: EventTemplate,
							attributes: ['id', 'slug', 'name', 'description', 'type'],
						},
					],
					transaction: t,
				}),
				UserEventSetting.findOne({
					where: { userId },
					transaction: t,
				}),
			]);

			await t.commit();

			return {
				active: activeEvents,
				completed: completedEvents,
				expired: expiredEvents,
				settings: userEventSettings || {},
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user events: ${err.message}`
			);
		}
	}

	/**
	 * Trigger a specific event for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Event ID
	 * @returns {Promise<Object>} Triggered event
	 */
	async triggerEvent(userId, slug) {
		const t = await sequelize.transaction();

		try {
			const now = new Date();

			// Check if event exists
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!event) {
				await t.rollback();
				throw ApiError.NotFound('Event not found');
			}

			// Check if event is already active
			const existingEvent = await UserEvent.findOne({
				where: {
					userId,
					eventId: event.id,
					status: 'ACTIVE',
				},
				transaction: t,
			});

			if (existingEvent) {
				await t.rollback();
				throw ApiError.BadRequest('Event is already active');
			}

			// Get user event settings
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

			// Create user event
			const duration = event.effect.duration || 0;
			const expiresAt =
				duration > 0 ? new Date(now.getTime() + duration * 1000) : null;

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

			// Apply event effects
			if (newEvent.effects) {
				for (const [key, value] of Object.entries(newEvent.effects)) {
					if (userEventSettings.eventMultipliers[key]) {
						userEventSettings.eventMultipliers[key] *= value;
					}
				}
				await userEventSettings.save({ transaction: t });
			}

			await t.commit();

			return {
				...newEvent.toJSON(),
				event: event.toJSON(),
			};
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to trigger event: ${err.message}`);
		}
	}

	/**
	 * Complete an event for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Event ID
	 * @returns {Promise<Object>} Completed event
	 */
	async completeEvent(userId, slug) {
		const t = await sequelize.transaction();

		try {
			// Find the user event
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				throw ApiError.NotFound('Event not found');
			}
			const userEvent = await UserEvent.findOne({
				where: {
					userId,
					eventId: event.id,
					status: 'ACTIVE',
				},
				transaction: t,
			});

			if (!userEvent) {
				await t.rollback();
				throw ApiError.NotFound('Active event not found');
			}

			if (!event) {
				await t.rollback();
				throw ApiError.NotFound('Event template not found');
			}

			// Get user event settings
			const userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				await t.rollback();
				throw ApiError.NotFound('User event settings not found');
			}

			// Remove event effects
			if (userEvent.effects) {
				for (const [key, value] of Object.entries(userEvent.effects)) {
					if (userEventSettings.eventMultipliers[key]) {
						userEventSettings.eventMultipliers[key] /= value;
					}
				}
				await userEventSettings.save({ transaction: t });
			}

			// Update event status
			userEvent.status = 'COMPLETED';
			userEvent.completedAt = new Date();
			await userEvent.save({ transaction: t });

			// Apply rewards if any
			if (event.effect.rewards) {
				const userState = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				if (userState) {
					// Apply resource rewards
					if (event.effect.rewards.stardust) {
						userState.stardust += event.effect.rewards.stardust;
					}
					if (event.effect.rewards.darkMatter) {
						userState.darkMatter += event.effect.rewards.darkMatter;
					}
					if (event.effect.rewards.tgStars) {
						userState.tgStars += event.effect.rewards.tgStars;
					}

					await userState.save({ transaction: t });
				}
			}

			// Set cooldown if specified
			if (event.triggerConfig.cooldown) {
				const cooldownMs = this.parseInterval(
					event.triggerConfig.cooldown
				);
				const cooldownUntil = new Date(Date.now() + cooldownMs);

				userEventSettings.eventCooldowns = {
					...userEventSettings.eventCooldowns,
					[event.id]: cooldownUntil,
				};

				await userEventSettings.save({ transaction: t });
			}

			await t.commit();

			return {
				...userEvent.toJSON(),
				event: event.toJSON(),
			};
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to complete event: ${err.message}`);
		}
	}

	/**
	 * Cancel an event for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Event ID
	 * @returns {Promise<Object>} Cancelled event
	 */
	async cancelEvent(userId, slug) {
		const t = await sequelize.transaction();

		try {
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				throw ApiError.NotFound('Event not found');
			}
			// Find the user event
			const userEvent = await UserEvent.findOne({
				where: {
					userId,
					eventId: event.id,
					status: 'ACTIVE',
				},
				transaction: t,
			});

			if (!userEvent) {
				await t.rollback();
				throw ApiError.NotFound('Active event not found');
			}

			// Get user event settings
			const userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				await t.rollback();
				throw ApiError.NotFound('User event settings not found');
			}

			// Remove event effects
			if (userEvent.effects) {
				for (const [key, value] of Object.entries(userEvent.effects)) {
					if (userEventSettings.eventMultipliers[key]) {
						userEventSettings.eventMultipliers[key] /= value;
					}
				}
				await userEventSettings.save({ transaction: t });
			}

			// Update event status
			userEvent.status = 'CANCELLED';
			await userEvent.save({ transaction: t });

			await t.commit();

			return userEvent;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to cancel event: ${err.message}`);
		}
	}

	/**
	 * Get a specific event for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Event ID
	 * @returns {Promise<Object>} User event
	 */
	async getUserEvent(userId, slug) {
		const t = await sequelize.transaction();

		try {
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				throw ApiError.NotFound('Event not found');
			}
			const userEvent = await UserEvent.findOne({
				where: {
					userId,
					eventId: event.id,
				},
				include: [
					{
						model: EventTemplate,
						attributes: [
							'id',
							'slug',
							'name',
							'description',
							'type',
							'effect',
							'triggerConfig',
							'active',
						],
					},
				],
				transaction: t,
			});

			if (!userEvent) {
				await t.rollback();
				throw ApiError.NotFound('Event not found');
			}

			await t.commit();
			return userEvent;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to get user event: ${err.message}`);
		}
	}

	/**
	 * Get event settings for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} User event settings
	 */
	async getUserEventSettings(userId) {
		const t = await sequelize.transaction();

		try {
			let settings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!settings) {
				settings = await UserEventSetting.create(
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
			return settings;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user event settings: ${err.message}`
			);
		}
	}

	/**
	 * Update event settings for a user
	 * @param {number} userId - User ID
	 * @param {Object} settingsData - Event settings data
	 * @returns {Promise<Object>} Updated user event settings
	 */
	async updateUserEventSettings(userId, settingsData) {
		const t = await sequelize.transaction();

		try {
			let settings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!settings) {
				settings = await UserEventSetting.create(
					{
						userId,
						...settingsData,
						lastEventCheck: new Date(),
					},
					{ transaction: t }
				);
			} else {
				await settings.update(settingsData, { transaction: t });
			}

			await t.commit();
			return settings;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update user event settings: ${err.message}`
			);
		}
	}

	/**
	 * Get event statistics for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} User event statistics
	 */
	async getUserEventStats(userId) {
		const t = await sequelize.transaction();

		try {
			const [activeCount, completedCount, expiredCount, settings] =
				await Promise.all([
					UserEvent.count({
						where: {
							userId,
							status: 'ACTIVE',
						},
						transaction: t,
					}),
					UserEvent.count({
						where: {
							userId,
							status: 'COMPLETED',
						},
						transaction: t,
					}),
					UserEvent.count({
						where: {
							userId,
							status: 'EXPIRED',
						},
						transaction: t,
					}),
					UserEventSetting.findOne({
						where: { userId },
						transaction: t,
					}),
				]);

			await t.commit();

			return {
				active: activeCount,
				completed: completedCount,
				expired: expiredCount,
				cancelled: 0, // Add this if you track cancelled events
				total: activeCount + completedCount + expiredCount,
				multipliers: settings ? settings.eventMultipliers : {},
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user event stats: ${err.message}`
			);
		}
	}

	/**
	 * Parse interval string to milliseconds
	 * @param {string} intervalString - Interval string (e.g., '1h', '30m')
	 * @returns {number} Milliseconds
	 */
	parseInterval(intervalString) {
		const match = intervalString.match(/^(\d+)([hms])$/);
		if (!match) return 3600000; // Default to 1 hour

		const value = parseInt(match[1]);
		const unit = match[2];

		switch (unit) {
			case 'h':
				return value * 3600000; // hours to ms
			case 'm':
				return value * 60000; // minutes to ms
			case 's':
				return value * 1000; // seconds to ms
			default:
				return 3600000; // Default to 1 hour
		}
	}
}

module.exports = new EventService();
