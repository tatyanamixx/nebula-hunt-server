/**
 * Game Service for game mechanics operations
 * Created by Claude on 15.07.2025
 * Extracted from market-service.js
 */
const {
	User,
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
	UserState,
	Galaxy,
	Artifact,
	PackageTemplate,
} = require("../models/models");
const { parseClientGalaxyData } = require("../utils/galaxy-utils");
const {
	UserUpgradeWithTemplate,
	UserTaskWithTemplate,
} = require("../models/template-views");
const ApiError = require("../exceptions/api-error");
const sequelize = require("../db");
const { Op } = require("sequelize");
const {
	SYSTEM_USER_ID,
	GALAXY_BASE_PRICE,
	GALAXY_LIMIT_FOR_USER,
	FREE_GALAXY_LIMIT,
} = require("../config/constants");
const { ERROR_CODES } = require("../config/error-codes");
const logger = require("./logger-service");
const userStateService = require("./user-state-service");
const marketService = require("./market-service");
const taskService = require("./task-service");

class GameService {
	/**
	 * Get the farming id for a resource
	 * @param {string} resource - Resource name
	 * @returns {BigInt} Farming id
	 */
	getResourceId(resource) {
		switch (resource) {
			case "stardust":
				return 1n;
			case "darkMatter":
				return 2n;
			case "stars":
				return 3n;
			case "tgStars":
				return 4n;
			case "tonToken":
				return 5n;
			default:
				throw ApiError.BadRequest("Invalid resource for farming");
		}
	}

	/**
	 * Register farming reward for internal currency
	 * @param {BigInt} userId - User ID
	 * @param {Array} offerData - Array of farming rewards [{"resource": "stardust", "amount": 3890}, {"resource": "darkMatter", "amount": X}]
	 * @param {Object} galaxyData - Galaxy data for updating lastCollectTime
	 * @param {Object} transaction - Transaction object
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerFarmingReward(userId, offerData, galaxyData = null, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		logger.debug("registerFarmingReward", { userId, offerData });

		try {
			// Validate farming data structure
			if (
				!Array.isArray(offerData) ||
				offerData.length === 0 ||
				offerData.length > 2
			) {
				throw ApiError.BadRequest(
					"Farming data must be an array with 1 or 2 elements",
					ERROR_CODES.VALIDATION.INVALID_FARMING_DATA
				);
			}

			// Validate each farming reward
			const validResources = ["stardust", "darkMatter"];
			const processedResources = new Set();

			for (const offer of offerData) {
				// Validate required fields
				if (!offer.resource || !offer.amount) {
					throw ApiError.BadRequest(
						"Each farming reward must have resource and amount",
						ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
					);
				}

				// Validate resource type
				if (!validResources.includes(offer.resource)) {
					throw ApiError.BadRequest(
						`Invalid resource: ${
							offer.resource
						}. Must be one of: ${validResources.join(", ")}`,
						ERROR_CODES.VALIDATION.INVALID_RESOURCE
					);
				}

				// Validate amount is positive
				if (offer.amount <= 0) {
					throw ApiError.BadRequest(
						`Amount must be positive for resource: ${offer.resource}`,
						ERROR_CODES.VALIDATION.INVALID_AMOUNT
					);
				}

				// Check for duplicate resources
				if (processedResources.has(offer.resource)) {
					throw ApiError.BadRequest(
						`Duplicate resource: ${offer.resource}`,
						ERROR_CODES.VALIDATION.DUPLICATE_RESOURCE
					);
				}

				processedResources.add(offer.resource);
			}

			// Ensure at least one resource is present
			if (processedResources.size === 0) {
				throw ApiError.BadRequest(
					"Farming data must include at least one resource with positive amount",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Process each farming reward using marketService.registerOffer
			const results = [];
			const marketService = require("./market-service");

			for (const offer of offerData) {
				// Prepare offer data for system transaction
				const systemOffer = {
					sellerId: SYSTEM_USER_ID,
					buyerId: userId,
					txType: "FARMING_REWARD",
					itemType: "resource", // Используем 'resource' вместо 'farming'
					itemId: this.getResourceId(offer.resource),
					price: 0, // Free from system user
					currency: "tonToken",
					amount: offer.amount,
					resource: offer.resource,
					offerType: "SYSTEM",
				};

				logger.debug("Processing farming reward", {
					userId,
					resource: offer.resource,
					amount: offer.amount,
				});

				// Use marketService.registerOffer for creating the transaction
				const result = await marketService.registerOffer(systemOffer, t);

				results.push({
					resource: offer.resource,
					amount: offer.amount,
					success: true,
					offerId: result.offer.id,
					marketTransactionId: result.marketTransaction.id,
				});
			}

			// Update galaxy lastCollectTime if galaxyData.seed is provided
			if (galaxyData && galaxyData.seed) {
				try {
					// Find galaxy by seed
					const galaxy = await Galaxy.findOne({
						where: { seed: galaxyData.seed },
						transaction: t,
					});

					if (galaxy) {
						// Update lastCollectTime to current time
						await galaxy.update(
							{ lastCollectTime: new Date() },
							{ transaction: t }
						);

						logger.debug("Updated galaxy lastCollectTime", {
							galaxyId: galaxy.id,
							galaxySeed: galaxy.seed,
							newLastCollectTime: new Date(),
						});
					}
				} catch (error) {
					logger.warn("Failed to update galaxy lastCollectTime", {
						userId,
						galaxySeed: galaxyData.seed,
						error: error.message,
					});
					// Don't fail the entire operation for this update
				}
			}

			// Get updated user state
			const userState = await userStateService.getUserState(userId, t);

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.info("Farming rewards registered successfully", {
				userId,
				rewards: results,
				userState: {
					stardust: userState.stardust,
					darkMatter: userState.darkMatter,
					stars: userState.stars,
				},
			});

			return {
				success: true,
				message: "Farming rewards transferred to user successfully",
				data: {
					rewards: results,
					userState: {
						stardust: userState.stardust,
						darkMatter: userState.darkMatter,
						stars: userState.stars,
					},
				},
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to register farming reward", {
				userId,
				offerData,
				error: err.message,
			});

			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register farming reward: ${err.message}`,
						ERROR_CODES.SYSTEM.DATABASE_ERROR
				  );
		}
	}

	// Helper methods for resource management
	async checkResourceAvailability(userId, resourceInfo, transaction) {
		const { type, amount } = resourceInfo;

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw ApiError.BadRequest(`User state not found for user ${userId}`);
		}

		const currentAmount = userState[type] || 0;
		if (currentAmount < amount) {
			throw ApiError.BadRequest(
				`Insufficient ${type}. Required: ${amount}, Available: ${currentAmount}`
			);
		}
	}

	async lockResource(userId, resourceInfo, transaction) {
		const { type, amount } = resourceInfo;

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw ApiError.BadRequest(`User state not found for user ${userId}`);
		}

		const currentAmount = userState[type] || 0;
		if (currentAmount < amount) {
			throw ApiError.BadRequest(
				`Insufficient ${type}. Required: ${amount}, Available: ${currentAmount}`
			);
		}

		// Deduct the resource
		await userState.update(
			{
				[type]: currentAmount - amount,
			},
			{ transaction }
		);

		logger.debug(`Resource ${type} locked for user ${userId}: ${amount}`);
	}

	async transferResource(offer, buyerId, transaction) {
		const { itemId, sellerId } = offer;

		// Parse itemId to get resource type and amount
		const [resourceType, amountStr] = itemId.split("_");
		const amount = parseInt(amountStr, 10);

		if (isNaN(amount)) {
			throw ApiError.BadRequest(
				`Invalid resource amount in itemId: ${itemId}`
			);
		}

		// Add resource to buyer
		await marketService.addCurrency(buyerId, resourceType, amount, transaction);

		logger.debug(
			`Resource ${resourceType} transferred from ${sellerId} to ${buyerId}: ${amount}`
		);
	}

	// Currency management methods are now handled by marketService
	// Use marketService.addCurrency() and marketService.deductCurrency() instead

	/**
	 * Create a galaxy with an offer
	 * @param {Object} galaxyData - данные галактики
	 * @param {number} buyerId - ID покупателя
	 * @param {Object} offer - данные оферты (price, currency, expiresAt)
	 * @param {Object} transaction - транзакция
	 */
	async createGalaxyWithOffer(galaxyData, buyerId, offer, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction; // Коммитим только если транзакция не была передана
		logger.debug("createGalaxyAsGift", { galaxyData, buyerId, offer });

		try {
			if (shouldCommit) {
				await sequelize.query("SET CONSTRAINTS ALL DEFERRED", {
					transaction: t,
				});
			}

			// Парсим данные галактики от клиента
			const parsedGalaxyData = parseClientGalaxyData(galaxyData);
			logger.debug("Parsed galaxy data", parsedGalaxyData);

			// 1. Создаем галактику от имени SYSTEM
			const [galaxy, created] = await Galaxy.findOrCreate({
				where: {
					seed: parsedGalaxyData.seed,
				},
				defaults: {
					userId: buyerId,
					...parsedGalaxyData,
					price: parsedGalaxyData.price || GALAXY_BASE_PRICE,
					active: true,
				},
				transaction: t,
			});
			if (!created && galaxy.userId !== buyerId) {
				throw ApiError.GalaxyAlreadyExists();
				logger.debug("galaxy already exists && buyerId !== galaxy.userId");
			}

			logger.debug("galaxy created", { galaxy });

			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: buyerId,
				price: offer.price,
				currency: offer.currency,
				itemId: galaxy.id,
				itemType: "galaxy",
				amount: galaxyData.starCurrent,
				resource: "stars",
				offerType: "SYSTEM",
				txType: "GALAXY_RESOURCE",
			};
			const result = await marketService.registerOffer(offerData, t);
			const userState = await userStateService.getUserState(buyerId, t);

			// Коммитим транзакцию только если она была создана в этом методе и не завершена
			if (shouldCommit && !t.finished) {
				await sequelize.query("SET CONSTRAINTS ALL IMMEDIATE", {
					transaction: t,
				});
				await t.commit();
			}

			const response = {
				galaxy: galaxy.toJSON(),
				userState,
				marketOffer: result,
			};
			logger.debug("createGalaxyWithOffer response", response);
			return response;
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			if (err instanceof ApiError) {
				throw err;
			}
			logger.error("Error in createGalaxyWithOffer", err);
			throw ApiError.DatabaseError(
				`Failed to create galaxy with offer: ${err.message}`
			);
		}
	}

	/**
	 * Register transfer stardust to galaxy - create offer for galaxy purchase with funds check
	 * @param {BigInt} userId - User ID from initdata
	 * @param {Object} galaxyData - Galaxy data {seed: string}
	 * @param {Object} reward - Reward data {currency: string, price: number, resource: string, amount: number}
	 * @param {Object} transaction - Database transaction
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerTransferStardustToGalaxy(userId, galaxyData, reward, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		logger.debug("registerTransferStardustToGalaxy", {
			userId,
			galaxyData,
			reward,
		});

		try {
			// Откладываем проверку всех deferrable ограничений
			await sequelize.query("SET CONSTRAINTS ALL DEFERRED", {
				transaction: t,
			});

			// Validate input data
			if (!galaxyData || !galaxyData.seed) {
				throw ApiError.BadRequest(
					"Galaxy seed is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (
				!reward ||
				!reward.currency ||
				!reward.price ||
				!reward.resource ||
				!reward.amount
			) {
				throw ApiError.BadRequest(
					"Reward must have currency, price, resource, and amount",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate price and amount are positive
			if (reward.price <= 0) {
				throw ApiError.BadRequest(
					"Price must be positive",
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			if (reward.amount <= 0) {
				throw ApiError.BadRequest(
					"Amount must be positive",
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			// Find galaxy by seed
			const galaxy = await Galaxy.findOne({
				where: { seed: galaxyData.seed },
				transaction: t,
			});

			if (!galaxy) {
				throw ApiError.BadRequest(
					"Galaxy not found",
					ERROR_CODES.GALAXY.GALAXY_NOT_FOUND
				);
			}

			logger.debug("Found galaxy", {
				galaxyId: galaxy.id,
				seed: galaxy.seed,
			});

			// Check if user has sufficient funds
			const userState = await userStateService.getUserState(userId, t);

			if (
				reward.currency === "stardust" &&
				userState.stardust < reward.price
			) {
				throw ApiError.BadRequest(
					"Insufficient stardust for this offer",
					ERROR_CODES.MARKET.INSUFFICIENT_FUNDS
				);
			}

			if (
				reward.currency === "darkMatter" &&
				userState.darkMatter < reward.price
			) {
				throw ApiError.BadRequest(
					"Insufficient dark matter for this offer",
					ERROR_CODES.MARKET.INSUFFICIENT_FUNDS
				);
			}

			if (reward.currency === "stars" && userState.stars < reward.price) {
				throw ApiError.BadRequest(
					"Insufficient stars for this offer",
					ERROR_CODES.MARKET.INSUFFICIENT_FUNDS
				);
			}

			logger.debug("User has sufficient funds", {
				userId,
				currency: reward.currency,
				price: reward.price,
				userState: {
					stardust: userState.stardust,
					darkMatter: userState.darkMatter,
					stars: userState.stars,
				},
			});

			// Prepare offer data similar to registerStarsTransferToGalaxy
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: reward.price,
				currency: reward.currency,
				itemId: galaxy.id,
				itemType: "galaxy",
				amount: reward.amount,
				resource: reward.resource,
				offerType: "SYSTEM",
				txType: "GALAXY_RESOURCE",
			};

			// Use marketService.registerOffer to create the transaction
			const result = await marketService.registerOffer(offerData, t);

			// Update galaxy starCurrent after successful conversion
			if (reward.resource === "stars" && reward.amount > 0) {
				await galaxy.increment("starCurrent", {
					by: reward.amount,
					transaction: t,
				});

				// Refresh galaxy data to get updated starCurrent
				await galaxy.reload({ transaction: t });

				logger.debug("Updated galaxy starCurrent", {
					galaxyId: galaxy.id,
					galaxySeed: galaxy.seed,
					newStarCurrent: galaxy.starCurrent,
					starsAdded: reward.amount,
				});
			}

			// Get updated user state
			const updatedUserState = await userStateService.getUserState(userId, t);

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.info("Galaxy purchase offer registered successfully", {
				userId,
				galaxyId: galaxy.id,
				galaxySeed: galaxy.seed,
				price: reward.price,
				currency: reward.currency,
				amount: reward.amount,
				resource: reward.resource,
				offerId: result.offer.id,
				marketTransactionId: result.marketTransaction.id,
			});

			return {
				success: true,
				message: "Galaxy purchase offer registered successfully",
				data: {
					galaxy: {
						id: galaxy.id,
						seed: galaxy.seed,
						starCurrent: galaxy.starCurrent,
						maxStars: galaxy.maxStars,
					},
					offer: {
						id: result.offer.id,
						price: reward.price,
						currency: reward.currency,
						amount: reward.amount,
						resource: reward.resource,
					},
					transaction: {
						id: result.marketTransaction.id,
						status: result.marketTransaction.status,
					},
					userState: {
						stardust: updatedUserState.stardust,
						darkMatter: updatedUserState.darkMatter,
						stars: updatedUserState.stars,
					},
				},
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to register transfer stardust to galaxy", {
				userId,
				galaxyData,
				reward,
				error: err.message,
			});

			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register transfer stardust to galaxy: ${err.message}`,
						ERROR_CODES.SYSTEM.DATABASE_ERROR
				  );
		}
	}

	/**
	 * Register generated galaxy when previous galaxy is filled with stars
	 * @param {BigInt} userId - User ID from initdata
	 * @param {Object} galaxyData - Galaxy data {seed: string, starMin?: number, starCurrent?: number, price?: number, particleCount?: number, onParticleCountChange?: boolean, galaxyProperties?: Object}
	 * @param {Object} transaction - Database transaction
	 * @param {string} sourceGalaxySeed - Seed of the galaxy that generated this new galaxy
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerGeneratedGalaxy(
		userId,
		galaxyData,
		transaction,
		sourceGalaxySeed = null
	) {
		logger.debug("registerGeneratedGalaxy START", {
			userId,
			galaxyData,
			sourceGalaxySeed,
			transaction: !!transaction,
		});

		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		logger.debug("registerGeneratedGalaxy - transaction created", {
			userId,
			galaxyData,
			shouldCommit,
		});

		try {
			// Validate input data
			if (!galaxyData || !galaxyData.seed) {
				throw ApiError.BadRequest(
					"Galaxy seed is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Check total galaxy limit for user
			const userGalaxiesCount = await Galaxy.count({
				where: { userId },
				transaction: t,
			});

			if (userGalaxiesCount >= GALAXY_LIMIT_FOR_USER) {
				throw ApiError.BadRequest(
					`User already has maximum number of galaxies (${GALAXY_LIMIT_FOR_USER})`,
					ERROR_CODES.VALIDATION.GALAXY_LIMIT_REACHED
				);
			}

			// Check free galaxy limit (only for galaxies generated from completed galaxies)
			if (sourceGalaxySeed) {
				const freeGalaxiesCount = await Galaxy.count({
					where: {
						userId,
						hasGeneratedGalaxy: true,
					},
					transaction: t,
				});

				if (freeGalaxiesCount >= FREE_GALAXY_LIMIT) {
					throw ApiError.BadRequest(
						`User already has maximum number of free galaxies (${FREE_GALAXY_LIMIT}). Additional galaxies can be purchased with tgStars.`,
						ERROR_CODES.VALIDATION.FREE_GALAXY_LIMIT_REACHED
					);
				}
			}

			// Prepare offer data with zero price and tgStars currency
			const offer = {
				price: 0,
				currency: "tgStars",
			};

			// Use existing createGalaxyWithOffer method
			logger.debug("registerGeneratedGalaxy - calling createGalaxyWithOffer", {
				userId,
				galaxyData,
				offer,
			});

			const result = await this.createGalaxyWithOffer(
				galaxyData,
				userId,
				offer,
				t
			);

			// Логируем результат для отладки
			logger.debug(
				"createGalaxyWithOffer result in registerGeneratedGalaxy:",
				{
					result,
					resultType: typeof result,
					hasResult: !!result,
					hasGalaxy: !!result?.galaxy,
					galaxyId: result?.galaxy?.id,
				}
			);

			// If this galaxy was generated by another galaxy, mark the source galaxy
			if (sourceGalaxySeed) {
				await Galaxy.update(
					{ hasGeneratedGalaxy: true },
					{
						where: {
							seed: sourceGalaxySeed,
							userId: userId,
						},
						transaction: t,
					}
				);

				logger.debug(
					"Marked source galaxy as having generated a new galaxy",
					{
						userId,
						sourceGalaxySeed,
					}
				);
			}

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.info("Generated galaxy registered successfully", {
				userId,
				galaxyId: result.galaxy.id,
				galaxySeed: galaxyData.seed,
			});

			return {
				success: true,
				message: "Generated galaxy registered successfully",
				data: {
					galaxy: result.galaxy,
					userState: result.userState,
					marketOffer: result.marketOffer,
				},
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to register generated galaxy", {
				userId,
				galaxyData,
				error: err.message,
			});

			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register generated galaxy: ${err.message}`,
						ERROR_CODES.SYSTEM.DATABASE_ERROR
				  );
		}
	}

	/**
	 * Claim daily reward for user
	 * @param {BigInt} userId - User ID
	 * @param {Object} transaction - Sequelize transaction
	 * @returns {Promise<Object>} - Daily reward result
	 */
	async claimDailyReward(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			await sequelize.query("SET CONSTRAINTS ALL DEFERRED", {
				transaction: t,
			});

			const userState = await userStateService.getUserState(userId, t);
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

			// Check if user already claimed today
			if (userState.lastDailyBonus) {
				const lastClaim = new Date(userState.lastDailyBonus);
				const lastClaimDate = new Date(
					lastClaim.getFullYear(),
					lastClaim.getMonth(),
					lastClaim.getDate()
				);

				if (lastClaimDate.getTime() === today.getTime()) {
					throw ApiError.BadRequest(
						"Daily reward already claimed today",
						ERROR_CODES.GAME.DAILY_REWARD_ALREADY_CLAIMED
					);
				}
			}

			// Calculate current streak
			let currentStreak = 1;
			if (userState.lastDailyBonus) {
				const lastClaim = new Date(userState.lastDailyBonus);
				const lastClaimDate = new Date(
					lastClaim.getFullYear(),
					lastClaim.getMonth(),
					lastClaim.getDate()
				);
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);

				if (lastClaimDate.getTime() === yesterday.getTime()) {
					// Consecutive day
					currentStreak = (userState.currentStreak || 0) + 1;
				} else if (lastClaimDate.getTime() < yesterday.getTime()) {
					// Streak broken
					currentStreak = 1;
				} else {
					// Same day or future date (shouldn't happen)
					currentStreak = userState.currentStreak || 1;
				}
			}

			// Get user's daily login tasks
			const { UserTask, TaskTemplate } = require("../models/models");

			// First, initialize user tasks if needed
			const taskService = require("./task-service");
			await taskService.initializeUserTasks(userId, t);

			// Then get the daily tasks
			const dailyTasks = await UserTask.findAll({
				include: [
					{
						model: TaskTemplate,
						where: {
							slug: {
								[require("sequelize").Op.in]: [
									"daily_login_stardust",
									"daily_login_darkmatter",
								],
							},
						},
						required: true,
					},
				],
				where: {
					userId: userId,
					active: true,
				},
				transaction: t,
			});

			// Process rewards based on task templates
			const processedRewards = [];
			for (const userTask of dailyTasks) {
				const taskTemplate = userTask.TaskTemplate;

				// Skip if taskTemplate is undefined
				if (!taskTemplate) {
					logger.warn("TaskTemplate is undefined for userTask", {
						userTaskId: userTask.id,
						userId: userTask.userId,
					});
					continue;
				}

				const condition = taskTemplate.condition;
				const reward = taskTemplate.reward;

				// Skip if condition or reward is missing
				if (!condition || !reward) {
					logger.warn("Missing condition or reward for task template", {
						taskSlug: taskTemplate.slug,
					});
					continue;
				}

				// Check if current day is in the allowed days array
				if (condition.days && condition.days.length > 0) {
					// Find the maximum day in the days array
					const maxDay = Math.max(...condition.days);

					// Calculate the effective streak for reward calculation
					// If currentStreak exceeds maxDay, cycle back to the beginning
					let effectiveStreak = currentStreak;
					if (currentStreak > maxDay) {
						// Calculate which day in the cycle we should be on
						const cyclePosition = ((currentStreak - 1) % maxDay) + 1;
						effectiveStreak = cyclePosition;
					}

					// Check if the effective streak is in the allowed days array
					if (condition.days.includes(effectiveStreak)) {
						const rewardAmount = Math.floor(
							reward.amount *
								(reward.multiplier || 1) *
								effectiveStreak
						);

						const offerData = {
							sellerId: SYSTEM_USER_ID,
							buyerId: userId,
							price: 0, // Daily rewards are free
							currency: "stardust", // Not used for free rewards
							itemId: userTask.id, // Use 0 for system rewards (no specific item)
							itemType: "task", // Use 'resource' type for daily rewards
							amount: rewardAmount,
							resource: reward.type,
							offerType: "SYSTEM",
							txType: "DAILY_REWARD",
						};

						const result = await marketService.registerOffer(
							offerData,
							t
						);
						processedRewards.push({
							resource: reward.type,
							amount: rewardAmount,
							transactionId: result.marketTransaction.id,
							taskSlug: taskTemplate.slug,
							effectiveStreak: effectiveStreak, // Add this for debugging
						});

						// Mark task as completed for today
						userTask.completed = true;
						userTask.completedAt = now;
						await userTask.save({ transaction: t });

						logger.debug("Daily reward processed with cycling logic", {
							userId,
							taskSlug: taskTemplate.slug,
							currentStreak,
							effectiveStreak,
							maxDay,
							rewardAmount,
							conditionDays: condition.days,
						});
					}
				}
			}

			// Update user state with new lastDailyBonus and streak
			await userStateService.updateUserState(
				userId,
				{
					...userState,
					lastDailyBonus: now,
					currentStreak: currentStreak,
					maxStreak: Math.max(currentStreak, userState.maxStreak || 0),
				},
				t
			);

			// Get updated user state
			const updatedUserState = await userStateService.getUserState(userId, t);

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.info("Daily reward claimed successfully", {
				userId,
				currentStreak,
				rewards: processedRewards,
				lastDailyBonus: now,
			});

			return {
				success: true,
				message: "Daily reward claimed successfully",
				data: {
					currentStreak,
					maxStreak: updatedUserState.maxStreak,
					rewards: processedRewards,
					userState: {
						stardust: updatedUserState.stardust,
						darkMatter: updatedUserState.darkMatter,
						stars: updatedUserState.stars,
					},
				},
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to claim daily reward", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to claim daily reward: ${err.message}`,
						ERROR_CODES.SYSTEM.DATABASE_ERROR
				  );
		}
	}

	/**
	 * Register captured galaxy with tgStars offer
	 * @param {BigInt} userId - User ID from initdata
	 * @param {Object} galaxyData - Galaxy data {seed: string, starMin?: number, starCurrent?: number, price?: number, particleCount?: number, onParticleCountChange?: boolean, galaxyProperties?: Object}
	 * @param {Object} offer - Offer data {price: number, currency: string}
	 * @param {Object} transaction - Database transaction
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerCapturedGalaxy(userId, galaxyData, offer, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		logger.debug("registerCapturedGalaxy called", {
			userId,
			galaxyData,
			offer,
		});

		try {
			// Prepare offer data for createGalaxyWithOffer
			const offerData = {
				buyerId: userId,
				price: offer.price,
				currency: offer.currency,
			};

			// Call the base method
			const result = await this.createGalaxyWithOffer(
				galaxyData,
				userId,
				offerData,
				t
			);

			if (shouldCommit) {
				await t.commit();
			}

			logger.info("Captured galaxy registered successfully", {
				userId,
				galaxySeed: galaxyData.seed,
				price: offer.price,
				currency: offer.currency,
				galaxyId: result.galaxy?.id,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw error;
		}
	}

	/**
	 * Complete galaxy capture payment from Telegram webhook
	 * @param {BigInt} userId - User ID from Telegram
	 * @param {Object} payload - Payment payload data
	 * @param {Object} payment - Telegram payment data
	 * @returns {Promise<Object>} Result of the operation
	 */
	async completeGalaxyCapturePayment(userId, payload, payment) {
		try {
			logger.info("Completing galaxy capture payment", {
				userId,
				payload,
				paymentId: payment.telegram_payment_charge_id,
			});

			// Создаем данные галактики из payload
			const galaxyData = {
				seed: payload.galaxySeed,
				name: payload.galaxyName || `Galaxy-${payload.galaxySeed}`,
				starMin: 100,
				starCurrent: 1000, // Базовое количество звезд
				maxStars: 80000 + Math.floor(Math.random() * 20000), // Случайный максимум
				birthDate: new Date().toISOString().split("T")[0],
				lastCollectTime: new Date(),
				type: "spiral", // Базовый тип
				colorPalette: "cosmic",
				background: "stars",
			};

			// Создаем offer для записи в БД
			const offer = {
				price: payload.price,
				currency: "tgStars",
				txType: "GALAXY_CAPTURE",
			};

			// Регистрируем захваченную галактику
			const result = await this.registerCapturedGalaxy(
				userId,
				galaxyData,
				offer
			);

			logger.info("Galaxy capture payment completed", {
				userId,
				galaxySeed: payload.galaxySeed,
				paymentId: payment.telegram_payment_charge_id,
			});

			return result;
		} catch (error) {
			logger.error("Failed to complete galaxy capture payment", {
				userId,
				payload,
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Complete stardust purchase payment from Telegram webhook
	 * @param {BigInt} userId - User ID from Telegram
	 * @param {Object} payload - Payment payload data
	 * @param {Object} payment - Telegram payment data
	 * @returns {Promise<Object>} Result of the operation
	 */
	async completeStardustPayment(userId, payload, payment) {
		try {
			logger.info("Completing stardust purchase payment", {
				userId,
				payload,
				paymentId: payment.telegram_payment_charge_id,
			});

			// Добавляем стардаст пользователю
			const result = await userStateService.addCurrency(
				userId,
				"stardust",
				payload.amount,
				null // transaction будет создан внутри
			);

			// Создаем запись о покупке в MarketOffer
			await MarketOffer.create({
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: payload.price,
				currency: "tgStars",
				amount: payload.amount,
				resource: "stardust",
				offerType: "SYSTEM",
				txType: "STARDUST_PURCHASE",
				status: "COMPLETED",
				completedAt: new Date(),
			});

			logger.info("Stardust purchase payment completed", {
				userId,
				amount: payload.amount,
				paymentId: payment.telegram_payment_charge_id,
			});

			return result;
		} catch (error) {
			logger.error("Failed to complete stardust purchase payment", {
				userId,
				payload,
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Complete dark matter purchase payment from Telegram webhook
	 * @param {BigInt} userId - User ID from Telegram
	 * @param {Object} payload - Payment payload data
	 * @param {Object} payment - Telegram payment data
	 * @returns {Promise<Object>} Result of the operation
	 */
	async completeDarkMatterPayment(userId, payload, payment) {
		try {
			logger.info("Completing dark matter purchase payment", {
				userId,
				payload,
				paymentId: payment.telegram_payment_charge_id,
			});

			// Добавляем темную материю пользователю
			const result = await userStateService.addCurrency(
				userId,
				"darkMatter",
				payload.amount,
				null // transaction будет создан внутри
			);

			// Создаем запись о покупке в MarketOffer
			await MarketOffer.create({
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: payload.price,
				currency: "tgStars",
				amount: payload.amount,
				resource: "darkMatter",
				offerType: "SYSTEM",
				txType: "DARK_MATTER_PURCHASE",
				status: "COMPLETED",
				completedAt: new Date(),
			});

			logger.info("Dark matter purchase payment completed", {
				userId,
				amount: payload.amount,
				paymentId: payment.telegram_payment_charge_id,
			});

			return result;
		} catch (error) {
			logger.error("Failed to complete dark matter purchase payment", {
				userId,
				payload,
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Complete galaxy upgrade payment from Telegram webhook
	 * @param {BigInt} userId - User ID from Telegram
	 * @param {Object} payload - Payment payload data
	 * @param {Object} payment - Telegram payment data
	 * @returns {Promise<Object>} Result of the operation
	 */
	async completeGalaxyUpgradePayment(userId, payload, payment) {
		try {
			logger.info("Completing galaxy upgrade payment", {
				userId,
				payload,
				paymentId: payment.telegram_payment_charge_id,
			});

			// TODO: Реализовать логику улучшения галактики
			// Пока просто логируем успешный платеж

			logger.info("Galaxy upgrade payment completed", {
				userId,
				upgradeType: payload.upgradeType,
				galaxyName: payload.galaxyName,
				paymentId: payment.telegram_payment_charge_id,
			});

			return {
				success: true,
				message: "Galaxy upgrade payment completed",
				data: {
					upgradeType: payload.upgradeType,
					galaxyName: payload.galaxyName,
				},
			};
		} catch (error) {
			logger.error("Failed to complete galaxy upgrade payment", {
				userId,
				payload,
				error: error.message,
			});
			throw error;
		}
	}
}

module.exports = new GameService();
