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
	 * Calculate stardust generation rate based on star count and upgrades
	 * @param {number} starCount - Current star count in galaxy
	 * @param {Object} playerParameters - Player upgrade parameters
	 * @returns {number} Stardust per hour
	 */
	calculateStardustRate(starCount, playerParameters) {
		const GAME_CONSTANTS = require("../config/game-constants");
		const baseStardustPerHour =
			GAME_CONSTANTS.ECONOMY.BASE_STARDUST_PER_HOUR || 5000;

		// Formula: base rate + (star count effect)
		const safeStarCount = Math.max(0, Number(starCount) || 0);
		const starEffect = Math.sqrt(safeStarCount) * 60;
		const baseRate = baseStardustPerHour + starEffect;

		// ✅ Get modifiers from playerParameters - все улучшения из сиддера
		// PRODUCTION UPGRADES
		const stardustProductionLevel =
			Number(playerParameters.stardust_production) || 0;
		const stardustProduction = stardustProductionLevel * 0.1; // +10% per level

		const starEfficiencyLevel = Number(playerParameters.star_efficiency) || 0;
		const starEfficiency = starEfficiencyLevel * 0.08; // +8% per level (из сиддера)

		const cosmicHarmonyLevel = Number(playerParameters.cosmic_harmony) || 0;
		const cosmicHarmony = cosmicHarmonyLevel;

		// MULTIPLIER UPGRADES
		const stardustMultiplierLevel =
			Number(playerParameters.stardust_multiplier) || 0;
		const stardustMultiplier = stardustMultiplierLevel * 0.2; // +20% per level

		const darkEnergyInfusionLevel =
			Number(playerParameters.dark_energy_infusion) || 0;
		const darkEnergyInfusion = darkEnergyInfusionLevel * 0.1; // +10% per level

		const cosmicAccelerationLevel =
			Number(playerParameters.cosmic_acceleration) || 0;
		const cosmicAcceleration = cosmicAccelerationLevel * 0.1; // +10% per level

		// ✅ Логируем уровни улучшений для отладки (INFO + console.log для гарантированного вывода)
		const upgradeLevelsData = {
			starCount: safeStarCount,
			baseRate,
			upgrades: {
				stardust_production: {
					level: stardustProductionLevel,
					bonus: stardustProduction,
				},
				star_efficiency: {
					level: starEfficiencyLevel,
					bonus: starEfficiency,
				},
				cosmic_harmony: { level: cosmicHarmonyLevel },
				stardust_multiplier: {
					level: stardustMultiplierLevel,
					bonus: stardustMultiplier,
				},
				dark_energy_infusion: {
					level: darkEnergyInfusionLevel,
					bonus: darkEnergyInfusion,
				},
				cosmic_acceleration: {
					level: cosmicAccelerationLevel,
					bonus: cosmicAcceleration,
				},
			},
		};
		logger.info("🔍 [calculateStardustRate] Upgrade levels:", upgradeLevelsData);
		console.log("🔍 [calculateStardustRate] Upgrade levels:", JSON.stringify(upgradeLevelsData, null, 2));

		// Apply production bonus
		const productionBonus = 1 + stardustProduction;

		// ✅ Apply star efficiency bonus (учитывает количество звезд)
		const efficiencyBonus = 1 + starEfficiency;

		// Apply multiplier bonus
		const multiplierBonus = 1 + stardustMultiplier;

		// Apply cosmic harmony bonus (depends on star count)
		let harmonyBonus = 1;
		if (cosmicHarmony > 0) {
			const starFactor =
				safeStarCount === 0
					? 0
					: Math.log10(Math.max(10, safeStarCount)) / Math.log10(10);
			harmonyBonus = 1 + cosmicHarmony * 0.15 * starFactor; // +15% per level
		}

		// Apply dark energy bonus
		const darkEnergyBonus = 1 + darkEnergyInfusion;

		// Apply speed bonus
		const speedBonus = 1 + cosmicAcceleration;

		// ✅ Calculate final rate - учитываем ВСЕ улучшения
		const finalRate = Math.floor(
			baseRate *
				productionBonus *
				efficiencyBonus *
				multiplierBonus *
				harmonyBonus *
				darkEnergyBonus *
				speedBonus
		);

		// ✅ Логируем финальный расчет для отладки (INFO + console.log для гарантированного вывода)
		const finalCalcData = {
			baseRate,
			productionBonus,
			efficiencyBonus,
			multiplierBonus,
			harmonyBonus,
			darkEnergyBonus,
			speedBonus,
			finalRate,
		};
		logger.info("📊 [calculateStardustRate] Final calculation:", finalCalcData);
		console.log("📊 [calculateStardustRate] Final calculation:", JSON.stringify(finalCalcData, null, 2));

		return finalRate;
	}

	/**
	 * Calculate dark matter generation rate based on upgrades
	 * @param {Object} playerParameters - Player upgrade parameters
	 * @returns {number} Dark matter per hour
	 */
	calculateDarkMatterRate(playerParameters) {
		const GAME_CONSTANTS = require("../config/game-constants");
		const baseDarkMatterRate = GAME_CONSTANTS.ECONOMY.BASE_DARK_MATTER_RATE || 5;

		// ✅ Dark matter upgrades - все улучшения из сиддера
		// CHANCE UPGRADES
		const darkMatterChanceLevel =
			Number(playerParameters.dark_matter_chance) || 0;
		const darkMatterChance = darkMatterChanceLevel * 0.5; // +50% per level

		const quantumInstabilityLevel =
			Number(playerParameters.quantum_instability) || 0;
		const quantumInstability = quantumInstabilityLevel * 0.02; // +2% per level (из сиддера)

		const voidResonanceLevel = Number(playerParameters.void_resonance) || 0;
		const voidResonance = voidResonanceLevel * 0.05; // +5% per level (из сиддера)

		// SPECIAL UPGRADES
		const darkMatterSynthesisLevel =
			Number(playerParameters.dark_matter_synthesis) || 0;
		const darkMatterSynthesis = darkMatterSynthesisLevel * 0.1; // +10% per level

		// ✅ Логируем уровни улучшений для отладки (INFO + console.log для гарантированного вывода)
		const darkMatterUpgradeLevelsData = {
			baseDarkMatterRate,
			upgrades: {
				dark_matter_chance: {
					level: darkMatterChanceLevel,
					bonus: darkMatterChance,
				},
				quantum_instability: {
					level: quantumInstabilityLevel,
					bonus: quantumInstability,
				},
				void_resonance: { level: voidResonanceLevel, bonus: voidResonance },
				dark_matter_synthesis: {
					level: darkMatterSynthesisLevel,
					bonus: darkMatterSynthesis,
				},
			},
		};
		logger.info("🔍 [calculateDarkMatterRate] Upgrade levels:", darkMatterUpgradeLevelsData);
		console.log("🔍 [calculateDarkMatterRate] Upgrade levels:", JSON.stringify(darkMatterUpgradeLevelsData, null, 2));

		// ✅ Apply bonuses - учитываем ВСЕ улучшения
		const chanceBonus = 1 + darkMatterChance;
		const instabilityBonus = 1 + quantumInstability;
		const resonanceBonus = 1 + voidResonance;
		const synthesisBonus = 1 + darkMatterSynthesis;

		// ✅ Calculate final rate - учитываем ВСЕ улучшения
		const finalRate = Math.floor(
			baseDarkMatterRate *
				chanceBonus *
				instabilityBonus *
				resonanceBonus *
				synthesisBonus
		);

		// ✅ Логируем финальный расчет для отладки (INFO + console.log для гарантированного вывода)
		const darkMatterFinalCalcData = {
			baseDarkMatterRate,
			chanceBonus,
			instabilityBonus,
			resonanceBonus,
			synthesisBonus,
			finalRate,
		};
		logger.info("📊 [calculateDarkMatterRate] Final calculation:", darkMatterFinalCalcData);
		console.log("📊 [calculateDarkMatterRate] Final calculation:", JSON.stringify(darkMatterFinalCalcData, null, 2));

		return finalRate;
	}

	/**
	 * Register farming reward for internal currency
	 * Now calculates resources on server based on lastCollectTime from DB
	 * @param {BigInt} userId - User ID
	 * @param {Object} galaxyData - Galaxy data with seed (required)
	 * @param {Object} transaction - Transaction object
	 * @returns {Promise<Object>} Result of the operation with calculated resources
	 */
	async registerFarmingReward(userId, galaxyData = null, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		logger.debug("registerFarmingReward", { userId, galaxyData });

		try {
			// Validate galaxyData
			if (!galaxyData || !galaxyData.seed) {
				throw ApiError.BadRequest(
					"galaxyData with seed is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Find galaxy by seed
			const galaxy = await Galaxy.findOne({
				where: { seed: galaxyData.seed },
				transaction: t,
			});

			if (!galaxy) {
				throw ApiError.BadRequest(
					`Galaxy with seed ${galaxyData.seed} not found`,
					ERROR_CODES.VALIDATION.NOT_FOUND
				);
			}

			// Verify galaxy belongs to user
			if (galaxy.userId !== userId) {
				throw ApiError.BadRequest(
					"Galaxy does not belong to user",
					ERROR_CODES.VALIDATION.UNAUTHORIZED
				);
			}

			// Get user state with playerParameters
			const userState = await userStateService.getUserState(userId, t);
			const playerParameters = userState.playerParameters || {};

			// ✅ Логируем playerParameters для отладки (INFO + console.log для гарантированного вывода)
			const logData = {
				userId,
				galaxySeed: galaxyData.seed,
				playerParameters,
				hasStardustProduction: !!playerParameters.stardust_production,
				hasStarEfficiency: !!playerParameters.star_efficiency,
				hasCosmicHarmony: !!playerParameters.cosmic_harmony,
				hasStardustMultiplier: !!playerParameters.stardust_multiplier,
				hasDarkEnergyInfusion: !!playerParameters.dark_energy_infusion,
				hasCosmicAcceleration: !!playerParameters.cosmic_acceleration,
				hasDarkMatterChance: !!playerParameters.dark_matter_chance,
				hasQuantumInstability: !!playerParameters.quantum_instability,
				hasVoidResonance: !!playerParameters.void_resonance,
				hasDarkMatterSynthesis: !!playerParameters.dark_matter_synthesis,
			};
			logger.info("🔍 [registerFarmingReward] Player parameters:", logData);
			console.log("🔍 [registerFarmingReward] Player parameters:", JSON.stringify(logData, null, 2));

			// Get lastCollectTime from DB (source of truth)
			const lastCollectTime = galaxy.lastCollectTime
				? new Date(galaxy.lastCollectTime).getTime()
				: Date.now();

			// Calculate time since last collection
			const now = Date.now();
			const timeDiff = Math.max(0, now - lastCollectTime);
			const hoursSinceLastCollect = timeDiff / (1000 * 60 * 60);

			// Get auto_collector level to determine max collection hours
			const autoCollectorLevel = playerParameters.auto_collector || 0;
			const maxCollectionHours = autoCollectorLevel > 0 ? 3 : 1;

			// Cap hours to max collection time
			const cappedHours = Math.min(hoursSinceLastCollect, maxCollectionHours);

			// Calculate stardust generation
			const starCount = galaxy.stars || 0;
			const stardustPerHour = this.calculateStardustRate(
				starCount,
				playerParameters
			);
			const stardustToAdd = Math.floor(stardustPerHour * cappedHours);

			// ✅ Логируем расчет stardust для отладки (INFO + console.log для гарантированного вывода)
			const stardustLogData = {
				userId,
				galaxySeed: galaxyData.seed,
				starCount,
				stardustPerHour,
				cappedHours,
				stardustToAdd,
				playerParameters: {
					stardust_production: playerParameters.stardust_production || 0,
					star_efficiency: playerParameters.star_efficiency || 0,
					cosmic_harmony: playerParameters.cosmic_harmony || 0,
					stardust_multiplier: playerParameters.stardust_multiplier || 0,
					dark_energy_infusion: playerParameters.dark_energy_infusion || 0,
					cosmic_acceleration: playerParameters.cosmic_acceleration || 0,
				},
			};
			logger.info("📊 [registerFarmingReward] Stardust calculation:", stardustLogData);
			console.log("📊 [registerFarmingReward] Stardust calculation:", JSON.stringify(stardustLogData, null, 2));

			// Calculate dark matter generation
			const darkMatterPerHour = this.calculateDarkMatterRate(playerParameters);
			const darkMatterToAdd = Math.floor(darkMatterPerHour * cappedHours);

			// ✅ Логируем расчет dark matter для отладки (INFO + console.log для гарантированного вывода)
			const darkMatterLogData = {
				userId,
				galaxySeed: galaxyData.seed,
				darkMatterPerHour,
				cappedHours,
				darkMatterToAdd,
				playerParameters: {
					dark_matter_chance: playerParameters.dark_matter_chance || 0,
					quantum_instability: playerParameters.quantum_instability || 0,
					void_resonance: playerParameters.void_resonance || 0,
					dark_matter_synthesis:
						playerParameters.dark_matter_synthesis || 0,
				},
			};
			logger.info("📊 [registerFarmingReward] Dark matter calculation:", darkMatterLogData);
			console.log("📊 [registerFarmingReward] Dark matter calculation:", JSON.stringify(darkMatterLogData, null, 2));

			// Prepare offer data for resources
			const offerData = [];
			if (stardustToAdd > 0) {
				offerData.push({ resource: "stardust", amount: stardustToAdd });
			}
			if (darkMatterToAdd > 0) {
				offerData.push({ resource: "darkMatter", amount: darkMatterToAdd });
			}

			// If no resources to add, return early
			if (offerData.length === 0) {
				// Still update lastCollectTime to prevent immediate re-collection
				const newLastCollectTime = new Date();
				await galaxy.update(
					{ lastCollectTime: newLastCollectTime },
					{ transaction: t }
				);

				// Reload galaxy to get updated lastCollectTime
				await galaxy.reload({ transaction: t });

				if (shouldCommit && !t.finished) {
					await t.commit();
				}

				// ✅ Преобразуем lastCollectTime в timestamp для клиента
				const lastCollectTimeTimestamp = galaxy.lastCollectTime
					? new Date(galaxy.lastCollectTime).getTime()
					: newLastCollectTime.getTime();

				return {
					success: true,
					message: "No resources to collect",
					data: {
						rewards: [],
						lastCollectTime: lastCollectTimeTimestamp,
						userState: {
							stardust: userState.stardust,
							darkMatter: userState.darkMatter,
							stars: userState.stars,
						},
					},
				};
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
					itemType: "resource",
					itemId: this.getResourceId(offer.resource),
					price: 0,
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

			// Update galaxy lastCollectTime to current time
			const newLastCollectTime = new Date();
			await galaxy.update(
				{ lastCollectTime: newLastCollectTime },
				{ transaction: t }
			);

			// Reload galaxy to get updated lastCollectTime
			await galaxy.reload({ transaction: t });

			// Get updated user state
			const updatedUserState = await userStateService.getUserState(userId, t);

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.info("Farming rewards registered successfully", {
				userId,
				galaxySeed: galaxyData.seed,
				rewards: results,
				hoursSinceLastCollect: cappedHours,
				userState: {
					stardust: updatedUserState.stardust,
					darkMatter: updatedUserState.darkMatter,
					stars: updatedUserState.stars,
				},
			});

			// ✅ Преобразуем lastCollectTime в timestamp для клиента
			const lastCollectTimeTimestamp = galaxy.lastCollectTime
				? new Date(galaxy.lastCollectTime).getTime()
				: newLastCollectTime.getTime();

			return {
				success: true,
				message: "Farming rewards transferred to user successfully",
				data: {
					rewards: results,
					lastCollectTime: lastCollectTimeTimestamp,
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

			logger.error("Failed to register farming reward", {
				userId,
				galaxyData,
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

			// Создаем offer для записи в БД через marketService
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: payload.price,
				currency: "tgStars",
				itemId: null, // Нет конкретного item
				itemType: "resource",
				amount: payload.amount,
				resource: "stardust",
				offerType: "SYSTEM",
				txType: "STARDUST_PURCHASE",
			};

			// Регистрируем offer через marketService для полного аудита
			const marketResult = await marketService.registerOffer(offerData);

			// Добавляем стардаст пользователю
			const result = await userStateService.addCurrency(
				userId,
				"stardust",
				payload.amount,
				null // transaction будет создан внутри
			);

			logger.info("Stardust purchase payment completed", {
				userId,
				amount: payload.amount,
				paymentId: payment.telegram_payment_charge_id,
				marketOfferId: marketResult?.id,
			});

			return {
				...result,
				marketOffer: marketResult,
			};
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

			// Создаем offer для записи в БД через marketService
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: payload.price,
				currency: "tgStars",
				itemId: null, // Нет конкретного item
				itemType: "resource",
				amount: payload.amount,
				resource: "darkMatter",
				offerType: "SYSTEM",
				txType: "DARK_MATTER_PURCHASE",
			};

			// Регистрируем offer через marketService для полного аудита
			const marketResult = await marketService.registerOffer(offerData);

			// Добавляем темную материю пользователю
			const result = await userStateService.addCurrency(
				userId,
				"darkMatter",
				payload.amount,
				null // transaction будет создан внутри
			);

			logger.info("Dark matter purchase payment completed", {
				userId,
				amount: payload.amount,
				paymentId: payment.telegram_payment_charge_id,
				marketOfferId: marketResult?.id,
			});

			return {
				...result,
				marketOffer: marketResult,
			};
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

	/**
	 * Complete package payment from Telegram webhook
	 * @param {BigInt} userId - User ID from Telegram
	 * @param {Object} payload - Payment payload data
	 * @param {Object} payment - Telegram payment data
	 * @returns {Promise<Object>} Result of the operation
	 */
	async completePackagePayment(userId, payload, payment) {
		try {
			logger.info("Completing package payment", {
				userId,
				payload,
				paymentId: payment.telegram_payment_charge_id,
			});

			// Получаем slug пакета из payload
			// Payload использует сокращенные имена для экономии места (t=type, s=slug, a=amount, r=resource, at=actionType, p=price, ts=timestamp)
			let packageSlug = payload.s || payload.packageSlug;

			// Если не нашли, пробуем из metadata
			if (!packageSlug && payload.metadata) {
				if (typeof payload.metadata === "string") {
					try {
						const metadataObj = JSON.parse(payload.metadata);
						packageSlug = metadataObj.s || metadataObj.packageSlug;
					} catch (e) {
						// metadata не JSON, игнорируем
					}
				} else if (typeof payload.metadata === "object") {
					packageSlug = payload.metadata.s || payload.metadata.packageSlug;
				}
			}

			if (!packageSlug) {
				logger.error("Package slug not found in payload", {
					userId,
					payloadKeys: Object.keys(payload),
					payload,
				});
				throw new Error("Package slug is required in payload");
			}

			// Подготавливаем offer для usePackage
			// Payload использует сокращенные имена: s=slug, a=amount, r=resource, at=actionType
			const offer = {};

			// Извлекаем данные из payload (сокращенные имена)
			const amount = payload.a || payload.amount;
			const actionType = payload.at || payload.packageActionType;

			// Если есть amount, используем его для variableAmount пакетов
			if (amount) {
				if (actionType === "variableAmount") {
					offer.amount = amount;
				} else {
					// Fallback для старой структуры
					offer.amount = amount;
				}
			}

			// Для updateField пакетов нужны field и value, но их нет в минимальном payload
			// Они будут получены из packageTemplate при вызове usePackage

			// Используем packageStoreService для выдачи ресурсов
			const packageStoreService = require("./package-store-service");
			const result = await packageStoreService.usePackage(
				packageSlug,
				userId,
				offer
			);

			// Создаем offer для записи в БД через marketService для аудита
			// Payload использует сокращенные имена: p=price, r=resource
			const paymentPrice = payload.p || payload.price;
			const resource = payload.r || payload.resource || null;
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: paymentPrice,
				currency: "tgStars",
				itemId: result.package?.id || null,
				itemType: "package",
				amount: 1,
				resource: resource,
				offerType: "SYSTEM",
				txType: "PACKAGE_PURCHASE",
			};

			// Регистрируем offer через marketService для полного аудита
			const marketService = require("./market-service");
			const marketResult = await marketService.registerOffer(offerData);

			logger.info("Package payment completed", {
				userId,
				packageSlug,
				paymentId: payment.telegram_payment_charge_id,
				marketOfferId: marketResult?.id,
			});

			return {
				success: true,
				message: "Package payment completed successfully",
				userState: result.userState,
				package: result.package,
				marketOffer: marketResult,
			};
		} catch (error) {
			logger.error("Failed to complete package payment", {
				userId,
				payload,
				error: error.message,
			});
			throw error;
		}
	}
}

module.exports = new GameService();
