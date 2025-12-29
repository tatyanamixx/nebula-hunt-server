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
const { ERROR_CODES } = require('../config/error-codes');
const sequelize = require('../db');
const logger = require('./logger-service');
const { Op } = require('sequelize');
const marketService = require('./market-service');
const { SYSTEM_USER_ID } = require('../config/constants');

class EventService {
	/**
	 * Initialize events for a new user using findOrCreate
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<Object>} Initialized user event settings
	 */
	async initializeUserEvents(userId, t) {
		const transaction = t || (await sequelize.transaction());
		const shouldCommit = !t;

		logger.debug('initializeUserEvents on start', { userId });

		try {
			// Get available events
			const availableEvents = await EventTemplate.findAll({
				where: { active: true },
				transaction: transaction,
			});

			if (availableEvents.length === 0) {
				logger.debug('No available events found', { userId });
				if (shouldCommit && !transaction.finished) {
					await transaction.commit();
				}
				return null;
			}

			// Initialize user events using findOrCreate
			const initializedEvents = [];
			for (const event of availableEvents) {
				try {
					const [userEvent, created] = await UserEvent.findOrCreate({
						where: { userId, eventTemplateId: event.id },
						defaults: {
							userId,
							eventTemplateId: event.id,
							status: 'ACTIVE',
							triggeredAt: new Date(),
							expiresAt: null,
							effects: event.effect.multipliers || {},
						},
						transaction: transaction,
					});

					if (created) {
						logger.debug('Created new user event', {
							userId,
							eventTemplateId: event.id,
							eventSlug: event.slug,
						});
					} else {
						logger.debug('User event already exists', {
							userId,
							eventTemplateId: event.id,
							eventSlug: event.slug,
						});
					}

					// Add to result regardless of whether it was created or already existed
					initializedEvents.push({
						...userEvent.toJSON(),
						event: event.toJSON(),
					});
				} catch (eventError) {
					logger.error('Error creating user event', {
						userId,
						eventTemplateId: event.id,
						eventSlug: event.slug,
						error: eventError.message,
					});
					throw ApiError.Internal(
						`Failed to create user event for template ${event.slug}: ${eventError.message}`,
						ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
					);
				}
			}

			// Create default event settings for the user using findOrCreate
			const [userEventSettings, settingsCreated] =
				await UserEventSetting.findOrCreate({
					where: { userId },
					defaults: {
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
					transaction: transaction,
				});

			if (settingsCreated) {
				logger.debug('Created new user event settings', { userId });
			} else {
				logger.debug('User event settings already exist', { userId });
			}

			if (shouldCommit && !transaction.finished) {
				await transaction.commit();
			}

			logger.debug('User events initialized successfully', {
				userId,
				eventsCreated: initializedEvents.length,
				settingsCreated,
			});

			return userEventSettings;
		} catch (err) {
			if (shouldCommit && !transaction.finished) {
				await transaction.rollback();
			}

			logger.error('Failed to initialize user events', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to initialize user events: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
			logger.debug('checkAndTriggerEvents on start', { userId });

			const userEvents = await this.initializeUserEvents(userId, t);
			logger.debug('User events initialized', {
				userId,
				userEvents: !!userEvents,
			});

			const now = new Date();

			// Get or create user event settings using findOrCreate
			const [userEventSettings, settingsCreated] =
				await UserEventSetting.findOrCreate({
					where: { userId },
					defaults: {
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
					transaction: t,
				});

			if (settingsCreated) {
				logger.debug('Created new user event settings', { userId });
			}

			// Get all available events
			const availableEvents = await EventTemplate.findAll({
				where: { active: true },
				transaction: t,
			});

			logger.debug('Available events found', {
				userId,
				availableEventsCount: availableEvents.length,
			});

			// Get active user events
			const activeUserEvents = await UserEvent.findAll({
				where: {
					userId,
					status: 'ACTIVE',
				},
				transaction: t,
			});

			logger.debug('Active user events found', {
				userId,
				activeEventsCount: activeUserEvents.length,
			});

			// Check and update existing event statuses
			let expiredEventsCount = 0;
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

					expiredEventsCount++;
					logger.debug('Event expired', {
						userId,
						eventTemplateId: userEvent.eventTemplateId,
						expiresAt: userEvent.expiresAt,
					});
				}
			}

			// Check and trigger new events
			const triggeredEvents = [];
			for (const event of availableEvents) {
				try {
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
								eventTemplateId: event.id,
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

						logger.debug('Event triggered', {
							userId,
							eventId: event.id,
							eventSlug: event.slug,
							duration,
							expiresAt,
						});
					}
				} catch (eventError) {
					logger.error('Error checking/triggering event', {
						userId,
						eventId: event.id,
						eventSlug: event.slug,
						error: eventError.message,
					});
					// Continue with other events instead of failing completely
				}
			}

			// Update last check time
			userEventSettings.lastEventCheck = now;
			await userEventSettings.save({ transaction: t });

			await t.commit();

			logger.debug('checkAndTriggerEvents completed successfully', {
				userId,
				triggeredEventsCount: triggeredEvents.length,
				expiredEventsCount,
				activeEventsCount: activeUserEvents.length,
			});

			return { triggeredEvents, activeEvents: activeUserEvents };
		} catch (err) {
			await t.rollback();

			logger.error('Failed to check and trigger events', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to check and trigger events: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
			logger.debug('getActiveUserEvents on start', { userId });

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

			const result = activeEvents.map((userEvent) => ({
				...userEvent.toJSON(),
				event: userEvent.eventtemplate?.toJSON(),
			}));

			await t.commit();

			logger.debug('getActiveUserEvents completed successfully', {
				userId,
				activeEventsCount: result.length,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get active user events', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get active events: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
			logger.debug('getAllUserEvents on start', { userId });

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
							attributes: [
								'id',
								'slug',
								'name',
								'description',
								'type',
							],
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
							attributes: [
								'id',
								'slug',
								'name',
								'description',
								'type',
							],
						},
					],
					transaction: t,
				}),
				UserEventSetting.findOne({
					where: { userId },
					transaction: t,
				}),
			]);

			const result = {
				active: activeEvents.map((event) => ({
					...event.toJSON(),
					event: event.eventtemplate?.toJSON(),
				})),
				completed: completedEvents.map((event) => ({
					...event.toJSON(),
					event: event.eventtemplate?.toJSON(),
				})),
				expired: expiredEvents.map((event) => ({
					...event.toJSON(),
					event: event.eventtemplate?.toJSON(),
				})),
				settings: userEventSettings ? userEventSettings.toJSON() : {},
			};

			await t.commit();

			logger.debug('getAllUserEvents completed successfully', {
				userId,
				activeCount: result.active.length,
				completedCount: result.completed.length,
				expiredCount: result.expired.length,
				hasSettings: !!userEventSettings,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get all user events', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user events: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
			logger.debug('triggerEvent on start', { userId, slug });

			const now = new Date();

			// Check if event exists
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!event) {
				logger.debug('triggerEvent - event template not found', {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Event template not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
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
				logger.debug('triggerEvent - event already active', {
					userId,
					slug,
					eventId: event.id,
				});
				throw ApiError.BadRequest(
					`Event is already active: ${slug}`,
					ERROR_CODES.EVENT.EVENT_ALREADY_ACTIVE
				);
			}

			// Get or create user event settings using findOrCreate
			const [userEventSettings, settingsCreated] =
				await UserEventSetting.findOrCreate({
					where: { userId },
					defaults: {
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
					transaction: t,
				});

			if (settingsCreated) {
				logger.debug('Created new user event settings', { userId });
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

			logger.debug('triggerEvent completed successfully', {
				userId,
				slug,
				eventId: newEvent.id,
				duration,
				expiresAt,
			});

			return {
				...newEvent.toJSON(),
				event: event.toJSON(),
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to trigger event', {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to trigger event: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
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
			logger.debug('completeEvent on start', { userId, slug });

			// Find the event template
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!event) {
				logger.debug('completeEvent - event template not found', {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Event template not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
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
				logger.debug('completeEvent - active event not found', {
					userId,
					slug,
					eventId: event.id,
				});
				throw ApiError.NotFound(
					`Active event not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_NOT_FOUND
				);
			}

			// Get user event settings
			const userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				logger.debug('completeEvent - user event settings not found', {
					userId,
				});
				throw ApiError.NotFound(
					`User event settings not found for user: ${userId}`,
					ERROR_CODES.USER_STATE.STATE_NOT_FOUND
				);
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

			// Apply rewards if any - ✅ Используем marketService для создания транзакций
			let rewardsApplied = {};
			if (event.effect.rewards) {
				const rewards = event.effect.rewards;

				// ✅ Создаём транзакции для каждого типа награды
				if (rewards.stardust && rewards.stardust > 0) {
					const offerData = {
						sellerId: SYSTEM_USER_ID,
						buyerId: userId,
						itemType: "event",
						itemId: userEvent.id,
						amount: rewards.stardust,
						resource: "stardust",
						price: 0,
						currency: "stardust",
						offerType: "SYSTEM",
						txType: "EVENT_REWARD",
						metadata: {
							eventSlug: event.slug,
							eventName: event.name,
							resource: "stardust",
						},
					};
					await marketService.registerOffer(offerData, t);
					rewardsApplied.stardust = rewards.stardust;
				}

				if (rewards.darkMatter && rewards.darkMatter > 0) {
					const offerData = {
						sellerId: SYSTEM_USER_ID,
						buyerId: userId,
						itemType: "event",
						itemId: userEvent.id,
						amount: rewards.darkMatter,
						resource: "darkMatter",
						price: 0,
						currency: "darkMatter",
						offerType: "SYSTEM",
						txType: "EVENT_REWARD",
						metadata: {
							eventSlug: event.slug,
							eventName: event.name,
							resource: "darkMatter",
						},
					};
					await marketService.registerOffer(offerData, t);
					rewardsApplied.darkMatter = rewards.darkMatter;
				}

				if (rewards.stars && rewards.stars > 0) {
					const offerData = {
						sellerId: SYSTEM_USER_ID,
						buyerId: userId,
						itemType: "event",
						itemId: userEvent.id,
						amount: rewards.stars,
						resource: "stars",
						price: 0,
						currency: "stars",
						offerType: "SYSTEM",
						txType: "EVENT_REWARD",
						metadata: {
							eventSlug: event.slug,
							eventName: event.name,
							resource: "stars",
						},
					};
					await marketService.registerOffer(offerData, t);
					rewardsApplied.stars = rewards.stars;
				}

				logger.debug('Event rewards applied via marketService', {
					userId,
					eventSlug: event.slug,
					rewardsApplied,
				});
			}

			// Set cooldown if specified
			let cooldownSet = false;
			if (event.triggerConfig?.cooldown) {
				const cooldownMs = this.parseInterval(
					event.triggerConfig.cooldown
				);
				const cooldownUntil = new Date(Date.now() + cooldownMs);

				userEventSettings.eventCooldowns = {
					...userEventSettings.eventCooldowns,
					[event.id]: cooldownUntil,
				};

				await userEventSettings.save({ transaction: t });
				cooldownSet = true;

				logger.debug('Event cooldown set', {
					userId,
					eventId: event.id,
					cooldownMs,
					cooldownUntil,
				});
			}

			await t.commit();

			logger.debug('completeEvent completed successfully', {
				userId,
				slug,
				eventId: userEvent.id,
				rewardsApplied: Object.keys(rewardsApplied).length > 0,
				cooldownSet,
			});

			return {
				...userEvent.toJSON(),
				event: event.toJSON(),
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to complete event', {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to complete event: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
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
			logger.debug('cancelEvent on start', { userId, slug });

			// Find the event template
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!event) {
				logger.debug('cancelEvent - event template not found', {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Event template not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
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
				logger.debug('cancelEvent - active event not found', {
					userId,
					slug,
					eventId: event.id,
				});
				throw ApiError.NotFound(
					`Active event not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_NOT_FOUND
				);
			}

			// Get user event settings
			const userEventSettings = await UserEventSetting.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userEventSettings) {
				logger.debug('cancelEvent - user event settings not found', {
					userId,
				});
				throw ApiError.NotFound(
					`User event settings not found for user: ${userId}`,
					ERROR_CODES.USER_STATE.STATE_NOT_FOUND
				);
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

			logger.debug('cancelEvent completed successfully', {
				userId,
				slug,
				eventId: userEvent.id,
			});

			return userEvent;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to cancel event', {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to cancel event: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
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
			logger.debug('getUserEvent on start', { userId, slug });

			// Find the event template
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!event) {
				logger.debug('getUserEvent - event template not found', {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Event template not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
			}

			// Find the user event
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
				logger.debug('getUserEvent - user event not found', {
					userId,
					slug,
					eventId: event.id,
				});
				throw ApiError.NotFound(
					`User event not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_NOT_FOUND
				);
			}

			const result = {
				...userEvent.toJSON(),
				event: userEvent.eventtemplate?.toJSON(),
			};

			await t.commit();

			logger.debug('getUserEvent completed successfully', {
				userId,
				slug,
				eventId: userEvent.id,
				status: userEvent.status,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user event', {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user event: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
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
			logger.debug('getUserEventSettings on start', { userId });

			const [settings, created] = await UserEventSetting.findOrCreate({
				where: { userId },
				defaults: {
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
				transaction: t,
			});

			if (created) {
				logger.debug('Created new user event settings', { userId });
			}

			await t.commit();

			logger.debug('getUserEventSettings completed successfully', {
				userId,
				settingsCreated: created,
			});

			return settings;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user event settings', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user event settings: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
			logger.debug('updateUserEventSettings on start', {
				userId,
				settingsData,
			});

			const [settings, created] = await UserEventSetting.findOrCreate({
				where: { userId },
				defaults: {
					userId,
					...settingsData,
					lastEventCheck: new Date(),
				},
				transaction: t,
			});

			if (!created) {
				await settings.update(settingsData, { transaction: t });
			}

			await t.commit();

			logger.debug('updateUserEventSettings completed successfully', {
				userId,
				settingsCreated: created,
			});

			return settings;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to update user event settings', {
				userId,
				settingsData,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to update user event settings: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
			logger.debug('getUserEventStats on start', { userId });

			const [
				activeCount,
				completedCount,
				expiredCount,
				cancelledCount,
				settings,
			] = await Promise.all([
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
				UserEvent.count({
					where: {
						userId,
						status: 'CANCELLED',
					},
					transaction: t,
				}),
				UserEventSetting.findOne({
					where: { userId },
					transaction: t,
				}),
			]);

			const total =
				activeCount + completedCount + expiredCount + cancelledCount;

			const result = {
				active: activeCount,
				completed: completedCount,
				expired: expiredCount,
				cancelled: cancelledCount,
				total,
				multipliers: settings ? settings.eventMultipliers : {},
			};

			await t.commit();

			logger.debug('getUserEventStats completed successfully', {
				userId,
				activeCount,
				completedCount,
				expiredCount,
				cancelledCount,
				total,
				hasSettings: !!settings,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user event stats', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user event stats: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
