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

		// Apply production bonus
		const productionBonus = 1 + stardustProduction;

		// ✅ Apply star efficiency bonus (учитывает количество звезд)
		const efficiencyBonus = 1 + starEfficiency;

		// Apply multiplier bonus
		const multiplierBonus = 1 + stardustMultiplier;

		// Apply cosmic harmony bonus (depends on star count)
		// ✅ Даже при 0 звездах даем минимальный бонус, если уровень > 0
		let harmonyBonus = 1;
		if (cosmicHarmony > 0) {
			if (safeStarCount === 0) {
				// Минимальный бонус при 0 звездах: +15% за уровень
				harmonyBonus = 1 + cosmicHarmony * 0.15;
			} else {
				// Бонус растет с количеством звезд
				const starFactor =
					Math.log10(Math.max(10, safeStarCount)) / Math.log10(10);
				harmonyBonus = 1 + cosmicHarmony * 0.15 * starFactor; // +15% per level * starFactor
			}
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

		return finalRate;
	}

	/**
	 * Calculate the cost to create stars in a galaxy
	 * This is the AUTHORITATIVE server-side calculation - client should NOT be trusted
	 * @param {number} currentStarCount - Current number of stars in the galaxy
	 * @param {number} galaxiesCount - Number of galaxies the user owns
	 * @param {Object} playerParameters - Player upgrade parameters
	 * @param {number} requestedStars - Number of stars to create (default 1)
	 * @param {boolean} applyRandomSale - Whether to apply random sale (default false for previews)
	 * @returns {number} Cost per single star
	 */
	calculateStarCost(
		currentStarCount,
		galaxiesCount,
		playerParameters,
		requestedStars = 1,
		applyRandomSale = false
	) {
		const result = this.calculateStarCostWithDetails(
			currentStarCount,
			galaxiesCount,
			playerParameters,
			requestedStars,
			applyRandomSale
		);
		return result.costPerStar;
	}

	/**
	 * Calculate the cost to create stars with detailed discount info
	 * @param {number} currentStarCount - Current number of stars in the galaxy
	 * @param {number} galaxiesCount - Number of galaxies the user owns
	 * @param {Object} playerParameters - Player upgrade parameters
	 * @param {number} requestedStars - Number of stars to create (default 1)
	 * @param {boolean} applyRandomSale - Whether to apply random sale (default false)
	 * @returns {Object} { costPerStar, totalCost, saleApplied, saleDiscountPercent, bulkDiscountApplied, bulkDiscountPercent }
	 */
	calculateStarCostWithDetails(
		currentStarCount,
		galaxiesCount,
		playerParameters,
		requestedStars = 1,
		applyRandomSale = false
	) {
		const GAME_CONSTANTS = require("../config/game-constants");
		const baseCost = GAME_CONSTANTS.ECONOMY.STARDUST_TO_STARS_RATIO || 100;

		// Cost multiplier based on existing stars - starts at 1 and increases
		// Using logarithmic scaling to make early stars affordable
		const safeStarCount = Math.max(0, Number(currentStarCount) || 0);
		const costMultiplier =
			safeStarCount === 0
				? 1
				: 1 + (Math.log10(safeStarCount + 100) - 2) * 1.337;

		// Galaxy multiplier - more galaxies = higher price
		const galaxyMultiplier = Math.max(1, Number(galaxiesCount) || 1);

		// Get upgrade modifiers from playerParameters
		// ✅ CORRECT SLUGS from seeders:
		// star_discount upgrade: -5% per level (modifier: starCostMultiplier: -0.05)
		const starDiscountLevel = Number(playerParameters.star_discount) || 0;
		const starCostMultiplier = starDiscountLevel * -0.05; // -5% per level

		// bulk_creation upgrade: +3% discount per level for bulk
		const bulkCreationLevel = Number(playerParameters.bulk_creation) || 0;
		const bulkDiscount = bulkCreationLevel * 0.03; // +3% per level

		// stellar_market upgrade: sale chance and discount
		const stellarMarketLevel = Number(playerParameters.stellar_market) || 0;
		const saleChance = stellarMarketLevel * 0.1; // +10% per level
		const saleDiscountValue = 0.2; // Fixed 20% discount during sales

		logger.debug("calculateStarCost modifiers", {
			starDiscountLevel,
			starCostMultiplier,
			bulkCreationLevel,
			bulkDiscount,
			stellarMarketLevel,
			saleChance,
		});

		// Apply star cost discount (starCostMultiplier is negative, so 1 + (-0.05) = 0.95)
		// Minimum 0.05 (5%) to ensure price is never zero or negative
		const discountMultiplier = Math.max(0.05, 1 + starCostMultiplier);

		// Bulk discount for creating multiple stars at once
		let bulkDiscountMultiplier = 1;
		let bulkDiscountApplied = false;
		let bulkDiscountPercent = 0;
		let bulkSavedAmount = 0;
		if (requestedStars > 1 && bulkDiscount > 0) {
			// Maximum discount reached at 10+ stars
			const bulkFactor = Math.min(1, (requestedStars - 1) / 9);
			bulkDiscountMultiplier = 1 - bulkDiscount * bulkFactor;
			bulkDiscountApplied = bulkDiscount * bulkFactor > 0;
			bulkDiscountPercent = Math.round(bulkDiscount * bulkFactor * 100);

			logger.info("📦 BULK DISCOUNT CALCULATED!", {
				requestedStars,
				bulkCreationLevel,
				bulkDiscount: (bulkDiscount * 100).toFixed(1) + "%",
				bulkFactor: bulkFactor.toFixed(2),
				bulkDiscountMultiplier: bulkDiscountMultiplier.toFixed(3),
				bulkDiscountApplied,
				bulkDiscountPercent: bulkDiscountPercent + "%",
			});
		} else {
			logger.debug("📦 No bulk discount:", {
				requestedStars,
				bulkCreationLevel,
				bulkDiscount,
				reason:
					requestedStars <= 1
						? "Only 1 star requested"
						: "No bulk_creation upgrade",
			});
		}

		// Random sales based on stellar_market upgrade
		// ✅ FIXED: Now truly random per purchase, not time-based
		let saleDiscountMultiplier = 1;
		let saleApplied = false;
		let saleDiscountPercent = 0;
		if (applyRandomSale && saleChance > 0) {
			// Random chance per purchase
			const randomRoll = Math.random();
			const isSaleActive = randomRoll < saleChance;

			if (isSaleActive) {
				// Maximum 95% discount during sale
				const actualSaleDiscount = Math.min(0.95, saleDiscountValue);
				saleDiscountMultiplier = 1 - actualSaleDiscount;
				saleApplied = true;
				saleDiscountPercent = Math.round(actualSaleDiscount * 100);
				logger.info("🎉 STELLAR MARKET SALE APPLIED!", {
					saleChance: Math.round(saleChance * 100) + "%",
					randomRoll: randomRoll.toFixed(3),
					saleDiscount: saleDiscountPercent + "%",
				});
			}
		}

		// Calculate cost WITHOUT bulk and sale discounts (for savings calculation)
		const costWithoutDiscounts = Math.max(
			1,
			Math.floor(
				baseCost * costMultiplier * galaxyMultiplier * discountMultiplier
			)
		);

		// Calculate cost WITH bulk but WITHOUT sale (for bulk savings)
		const costWithBulkOnly = Math.max(
			1,
			Math.floor(costWithoutDiscounts * bulkDiscountMultiplier)
		);

		// Calculate final cost per star (with all discounts)
		const costPerStar = Math.max(
			1,
			Math.floor(costWithBulkOnly * saleDiscountMultiplier)
		);

		const totalCost = Math.round(costPerStar * requestedStars);
		const totalWithoutDiscounts = Math.round(
			costWithoutDiscounts * requestedStars
		);
		const totalWithBulkOnly = Math.round(costWithBulkOnly * requestedStars);

		// Calculate actual saved amounts
		if (bulkDiscountApplied) {
			bulkSavedAmount = totalWithoutDiscounts - totalWithBulkOnly;
		}
		const saleSavedAmount = saleApplied ? totalWithBulkOnly - totalCost : 0;

		logger.info("💰 PRICE CALCULATION COMPLETE", {
			requestedStars,
			costWithoutDiscounts,
			costWithBulkOnly,
			costPerStar,
			totalWithoutDiscounts,
			totalWithBulkOnly,
			totalCost,
			bulkSavedAmount,
			saleSavedAmount,
		});

		return {
			costPerStar,
			totalCost,
			saleApplied,
			saleDiscountPercent,
			saleSavedAmount,
			bulkDiscountApplied,
			bulkDiscountPercent,
			bulkSavedAmount,
		};
	}

	/**
	 * Calculate total cost for creating multiple stars
	 * @param {number} currentStarCount - Current number of stars in the galaxy
	 * @param {number} galaxiesCount - Number of galaxies the user owns
	 * @param {Object} playerParameters - Player upgrade parameters
	 * @param {number} starsToCreate - Number of stars to create
	 * @returns {number} Total cost for all stars
	 */
	calculateTotalStarCost(
		currentStarCount,
		galaxiesCount,
		playerParameters,
		starsToCreate
	) {
		const costPerStar = this.calculateStarCost(
			currentStarCount,
			galaxiesCount,
			playerParameters,
			starsToCreate
		);
		return Math.round(costPerStar * starsToCreate);
	}

	/**
	 * Get star price for a specific galaxy (API endpoint helper)
	 * @param {BigInt} userId - User ID
	 * @param {string} galaxySeed - Galaxy seed
	 * @param {number} starsToCreate - Number of stars (default 1)
	 * @returns {Promise<Object>} Price information
	 */
	async getStarPrice(userId, galaxySeed, starsToCreate = 1) {
		// Get galaxy
		const galaxy = await Galaxy.findOne({
			where: { seed: galaxySeed, userId },
		});

		if (!galaxy) {
			throw ApiError.BadRequest("Galaxy not found or doesn't belong to user");
		}

		// Get user state with player parameters
		const userState = await userStateService.getUserState(userId);
		const playerParameters = userState.playerParameters || {};

		// Get number of user's galaxies
		const galaxiesCount = await Galaxy.count({ where: { userId } });

		// Calculate price
		const pricePerStar = this.calculateStarCost(
			galaxy.starCurrent,
			galaxiesCount,
			playerParameters,
			starsToCreate
		);
		const totalPrice = this.calculateTotalStarCost(
			galaxy.starCurrent,
			galaxiesCount,
			playerParameters,
			starsToCreate
		);

		return {
			pricePerStar,
			totalPrice,
			starsToCreate,
			currentStarCount: galaxy.starCurrent,
			galaxiesCount,
			// Debug info for price breakdown
			debug: {
				baseCost: 100,
				starDiscountLevel: playerParameters.star_discount || 0,
				bulkCreationLevel: playerParameters.bulk_creation || 0,
				stellarMarketLevel: playerParameters.stellar_market || 0,
			},
		};
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

		// ✅ Преобразуем userId в число для логирования (BigInt не сериализуется)
		const debugUserId =
			typeof userId === "bigint" ? Number(userId) : Number(userId);
		logger.debug("registerFarmingReward", { userId: debugUserId, galaxyData });

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

			// ✅ Преобразуем userId в число для сериализации (BigInt не сериализуется)
			const numericUserId =
				typeof userId === "bigint" ? Number(userId) : Number(userId);

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

			// ✅ Calculate stardust generation
			// ✅ Используем starCurrent, а не stars (в модели Galaxy поле называется starCurrent)
			const starCount = galaxy.starCurrent || 0;
			const stardustPerHour = this.calculateStardustRate(
				starCount,
				playerParameters
			);
			const stardustToAdd = Math.floor(stardustPerHour * cappedHours);

			// Calculate dark matter generation
			const darkMatterPerHour = this.calculateDarkMatterRate(playerParameters);
			const darkMatterToAdd = Math.floor(darkMatterPerHour * cappedHours);

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
					userId: numericUserId,
					resource: offer.resource,
					amount: offer.amount,
				});

				// Use marketService.registerOffer for creating the transaction
				const result = await marketService.registerOffer(systemOffer, t);

				// ✅ Преобразуем BigInt в число для сериализации
				const offerId =
					typeof result.offer.id === "bigint"
						? Number(result.offer.id)
						: Number(result.offer.id);
				const marketTransactionId =
					typeof result.marketTransaction.id === "bigint"
						? Number(result.marketTransaction.id)
						: Number(result.marketTransaction.id);

				results.push({
					resource: offer.resource,
					amount: offer.amount,
					success: true,
					offerId: offerId,
					marketTransactionId: marketTransactionId,
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
				userId: numericUserId,
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

			// ✅ Преобразуем userId в число для логирования (BigInt не сериализуется)
			const errorUserId =
				typeof userId === "bigint" ? Number(userId) : Number(userId);
			logger.error("Failed to register farming reward", {
				userId: errorUserId,
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

			// ✅ Если starCurrent не установлен (null), это захват галактики - рассчитываем 40000-60000 детерминированно
			if (
				parsedGalaxyData.starCurrent === null ||
				parsedGalaxyData.starCurrent === undefined
			) {
				const {
					generateStarCountForCapture,
				} = require("../utils/galaxy-utils");
				parsedGalaxyData.starCurrent = generateStarCountForCapture(
					parsedGalaxyData.seed
				);
				logger.debug("Calculated starCurrent for galaxy capture", {
					seed: parsedGalaxyData.seed,
					starCurrent: parsedGalaxyData.starCurrent,
				});
			}

			// ✅ Если визуальные свойства не установлены (null), генерируем их детерминированно на основе seed
			// Это fallback на случай, если клиент не передал свойства
			if (
				!parsedGalaxyData.galaxyType ||
				!parsedGalaxyData.colorPalette ||
				!parsedGalaxyData.backgroundType
			) {
				const {
					generateGalaxyTypeFromSeed,
					generateColorPaletteFromSeed,
					generateBackgroundFromSeed,
				} = require("../utils/galaxy-utils");

				parsedGalaxyData.galaxyType =
					parsedGalaxyData.galaxyType ||
					generateGalaxyTypeFromSeed(parsedGalaxyData.seed);
				parsedGalaxyData.colorPalette =
					parsedGalaxyData.colorPalette ||
					generateColorPaletteFromSeed(parsedGalaxyData.seed);
				parsedGalaxyData.backgroundType =
					parsedGalaxyData.backgroundType ||
					generateBackgroundFromSeed(parsedGalaxyData.seed);

				logger.debug("Generated missing visual properties", {
					seed: parsedGalaxyData.seed,
					type: parsedGalaxyData.galaxyType,
					colorPalette: parsedGalaxyData.colorPalette,
					backgroundType: parsedGalaxyData.backgroundType,
				});
			}

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
				txType: offer.txType || "GALAXY_RESOURCE", // ✅ Используем txType из offer, если передан, иначе GALAXY_RESOURCE
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

			// ✅ Извлекаем визуальные свойства из galaxyProperties (приоритет) или из прямых полей
			// Это должно совпадать с логикой в galaxy-service.js
			const galaxyJSON = galaxy.toJSON();
			const galaxyProperties = galaxyJSON.galaxyProperties || {};
			const extractedType =
				galaxyProperties.type || galaxyJSON.galaxyType || galaxyJSON.type;
			const extractedColorPalette =
				galaxyProperties.colorPalette || galaxyJSON.colorPalette;
			const extractedBackground =
				galaxyProperties.background ||
				galaxyJSON.backgroundType ||
				galaxyJSON.background;

			// ✅ Добавляем извлеченные свойства в ответ для удобства клиента
			const galaxyResponse = {
				...galaxyJSON,
				type: extractedType,
				colorPalette: extractedColorPalette,
				background: extractedBackground,
			};

			const response = {
				galaxy: galaxyResponse,
				userState,
				marketOffer: result,
			};
			logger.debug("createGalaxyWithOffer response", {
				...response,
				galaxy: {
					...galaxyResponse,
					galaxyProperties: galaxyProperties, // Логируем для отладки
				},
			});
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
	 * ⚠️ SECURITY: Price is calculated SERVER-SIDE, client price is IGNORED
	 * @param {BigInt} userId - User ID from initdata
	 * @param {Object} galaxyData - Galaxy data {seed: string}
	 * @param {Object} reward - Reward data {currency: string, price: number (IGNORED), resource: string, amount: number}
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

			if (!reward || !reward.currency || !reward.resource || !reward.amount) {
				throw ApiError.BadRequest(
					"Reward must have currency, resource, and amount",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
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

			// Verify galaxy belongs to user
			if (galaxy.userId !== userId) {
				throw ApiError.BadRequest(
					"Galaxy does not belong to user",
					ERROR_CODES.VALIDATION.UNAUTHORIZED
				);
			}

			logger.debug("Found galaxy", {
				galaxyId: galaxy.id,
				seed: galaxy.seed,
				starCurrent: galaxy.starCurrent,
			});

			// Get user state with player parameters for price calculation
			const userState = await userStateService.getUserState(userId, t);
			const playerParameters = userState.playerParameters || {};

			// Get number of user's galaxies for price multiplier
			const galaxiesCount = await Galaxy.count({
				where: { userId },
				transaction: t,
			});

			// ⚠️ SECURITY: Calculate price SERVER-SIDE with random sale - ignore client's reward.price
			const priceDetails = this.calculateStarCostWithDetails(
				galaxy.starCurrent,
				galaxiesCount,
				playerParameters,
				reward.amount,
				true // ✅ Apply random sale for actual purchases
			);
			const serverCalculatedPrice = priceDetails.totalCost;

			logger.info("Server-side price calculation", {
				userId,
				galaxySeed: galaxy.seed,
				starsToCreate: reward.amount,
				currentStarCount: galaxy.starCurrent,
				galaxiesCount,
				clientPrice: reward.price, // For debugging - this is IGNORED
				serverPrice: serverCalculatedPrice, // This is the ACTUAL price
				pricePerStar: priceDetails.costPerStar,
				saleApplied: priceDetails.saleApplied,
				saleDiscountPercent: priceDetails.saleDiscountPercent,
				bulkDiscountApplied: priceDetails.bulkDiscountApplied,
				bulkDiscountPercent: priceDetails.bulkDiscountPercent,
			});

			// Check if user has sufficient funds using SERVER-CALCULATED price
			if (
				reward.currency === "stardust" &&
				userState.stardust < serverCalculatedPrice
			) {
				throw ApiError.BadRequest(
					`Insufficient stardust. Need ${serverCalculatedPrice}, have ${userState.stardust}`,
					ERROR_CODES.MARKET.INSUFFICIENT_FUNDS
				);
			}

			if (
				reward.currency === "darkMatter" &&
				userState.darkMatter < serverCalculatedPrice
			) {
				throw ApiError.BadRequest(
					`Insufficient dark matter. Need ${serverCalculatedPrice}, have ${userState.darkMatter}`,
					ERROR_CODES.MARKET.INSUFFICIENT_FUNDS
				);
			}

			if (
				reward.currency === "stars" &&
				userState.stars < serverCalculatedPrice
			) {
				throw ApiError.BadRequest(
					`Insufficient stars. Need ${serverCalculatedPrice}, have ${userState.stars}`,
					ERROR_CODES.MARKET.INSUFFICIENT_FUNDS
				);
			}

			logger.debug("User has sufficient funds for server-calculated price", {
				userId,
				currency: reward.currency,
				serverPrice: serverCalculatedPrice,
				userBalance: {
					stardust: userState.stardust,
					darkMatter: userState.darkMatter,
					stars: userState.stars,
				},
			});

			// Prepare offer data with SERVER-CALCULATED price
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: serverCalculatedPrice, // ⚠️ Use SERVER price, not client price!
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
				serverPrice: serverCalculatedPrice,
				currency: reward.currency,
				amount: reward.amount,
				resource: reward.resource,
				offerId: result.offer.id,
				marketTransactionId: result.marketTransaction.id,
			});

			// Calculate new price for UI update
			const newPricePerStar = this.calculateStarCost(
				galaxy.starCurrent, // This is now the UPDATED star count after increment
				galaxiesCount,
				playerParameters,
				1
			);

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
						price: serverCalculatedPrice, // Return actual price used
						pricePerStar: priceDetails.costPerStar, // Price per star that was charged
						newPricePerStar, // New price per star for UI update
						currency: reward.currency,
						amount: reward.amount,
						resource: reward.resource,
					},
					// ✅ Discount information for client toasts
					discounts: {
						saleApplied: priceDetails.saleApplied,
						saleDiscountPercent: priceDetails.saleDiscountPercent,
						saleSavedAmount: priceDetails.saleSavedAmount || 0,
						bulkDiscountApplied: priceDetails.bulkDiscountApplied,
						bulkDiscountPercent: priceDetails.bulkDiscountPercent,
						bulkSavedAmount: priceDetails.bulkSavedAmount || 0,
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
				txType: offer.txType || "GALAXY_CAPTURE", // ✅ Используем txType из offer (GALAXY_CAPTURE)
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

			logger.debug("Galaxy capture - star count calculation", {
				minStars: 40000,
				maxStars: 60000,
			});

			// Payload использует сокращенные имена: p=price, gs=galaxySeed, gn=galaxyName
			const paymentPrice = payload.p || payload.price;
			const galaxySeed = payload.gs || payload.galaxySeed;

			if (!paymentPrice || !galaxySeed) {
				throw new Error(
					"Missing required payload data: price (p) and galaxySeed (gs) are required"
				);
			}

			// Преобразуем userId в BigInt если нужно
			const userIdBigInt = BigInt(userId);

			// Создаем данные галактики из payload
			// ✅ При захвате галактики должно быть 40000-60000 звезд (детерминированно на основе seed)
			// ✅ Название, тип, цвет и фон также генерируются детерминированно на основе seed
			const {
				generateStarCountForCapture,
				generateMaxStars,
				getGalaxyNameFromSeed,
				generateGalaxyTypeFromSeed,
				generateColorPaletteFromSeed,
				generateBackgroundFromSeed,
			} = require("../utils/galaxy-utils");
			const starCurrent = generateStarCountForCapture(galaxySeed);
			const galaxyMaxStars = generateMaxStars(galaxySeed);
			const galaxyName = getGalaxyNameFromSeed(galaxySeed); // ✅ Детерминированная генерация названия
			const galaxyType = generateGalaxyTypeFromSeed(galaxySeed); // ✅ Детерминированная генерация типа
			const colorPalette = generateColorPaletteFromSeed(galaxySeed); // ✅ Детерминированная генерация цвета
			const background = generateBackgroundFromSeed(galaxySeed); // ✅ Детерминированная генерация фона

			const galaxyData = {
				seed: galaxySeed,
				name: galaxyName, // ✅ Используем детерминированное название на основе seed
				starMin: 100,
				starCurrent: starCurrent, // ✅ 40000-60000 звезд при захвате
				maxStars: galaxyMaxStars,
				birthDate: new Date().toISOString().split("T")[0],
				lastCollectTime: new Date(),
				type: galaxyType, // ✅ Детерминированная генерация типа на основе seed
				colorPalette: colorPalette, // ✅ Детерминированная генерация цвета на основе seed
				background: background, // ✅ Детерминированная генерация фона на основе seed
			};

			// Создаем offer для записи в БД
			const offer = {
				price: paymentPrice,
				currency: "tgStars",
				txType: "GALAXY_CAPTURE",
			};

			// Регистрируем захваченную галактику
			const result = await this.registerCapturedGalaxy(
				userIdBigInt,
				galaxyData,
				offer
			);

			logger.info("Galaxy capture payment completed", {
				userId: userIdBigInt.toString(),
				galaxySeed,
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

			// Payload использует сокращенные имена: p=price, a=amount
			const paymentPrice = payload.p || payload.price;
			const amount = payload.a || payload.amount;

			if (
				paymentPrice === undefined ||
				paymentPrice === null ||
				amount === undefined ||
				amount === null
			) {
				logger.error("Missing required payload data", {
					payload,
					paymentPrice,
					amount,
					hasP: payload.p !== undefined,
					hasPrice: payload.price !== undefined,
					hasA: payload.a !== undefined,
					hasAmount: payload.amount !== undefined,
				});
				throw new Error(
					"Missing required payload data: price (p) and amount (a) are required"
				);
			}

			// Преобразуем в числа для безопасности
			const paymentPriceNum = Number(paymentPrice);
			const amountNum = Number(amount);

			if (
				isNaN(paymentPriceNum) ||
				isNaN(amountNum) ||
				paymentPriceNum <= 0 ||
				amountNum <= 0
			) {
				logger.error("Invalid payload data values", {
					payload,
					paymentPrice,
					amount,
					paymentPriceNum,
					amountNum,
				});
				throw new Error(
					"Invalid payload data: price and amount must be positive numbers"
				);
			}

			// Преобразуем userId в BigInt если нужно
			const userIdBigInt = BigInt(userId);

			// Создаем offer для записи в БД через marketService
			// Используем getResourceId для получения правильного ID ресурса
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userIdBigInt,
				price: paymentPriceNum,
				currency: "tgStars",
				itemId: this.getResourceId("stardust"), // Используем метод для получения ID ресурса
				itemType: "resource",
				amount: amountNum,
				resource: "stardust",
				offerType: "SYSTEM",
				txType: "STARDUST_PURCHASE",
			};

			// Регистрируем offer через marketService для полного аудита
			// registerOffer уже добавляет валюту пользователю (строки 1830-1835 в market-service.js)
			const marketResult = await marketService.registerOffer(offerData);

			logger.info("Stardust purchase payment completed", {
				userId: userIdBigInt.toString(),
				amount: amountNum,
				price: paymentPriceNum,
				paymentId: payment.telegram_payment_charge_id,
				marketOfferId: marketResult?.offer?.id,
			});

			return {
				success: true,
				message: "Stardust purchase payment completed",
				data: {
					amount: amountNum,
					price: paymentPriceNum,
					marketOffer: marketResult,
				},
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

			// Payload использует сокращенные имена: p=price, a=amount
			const paymentPrice = payload.p || payload.price;
			const amount = payload.a || payload.amount;

			if (
				paymentPrice === undefined ||
				paymentPrice === null ||
				amount === undefined ||
				amount === null
			) {
				logger.error("Missing required payload data", {
					payload,
					paymentPrice,
					amount,
					hasP: payload.p !== undefined,
					hasPrice: payload.price !== undefined,
					hasA: payload.a !== undefined,
					hasAmount: payload.amount !== undefined,
				});
				throw new Error(
					"Missing required payload data: price (p) and amount (a) are required"
				);
			}

			// Преобразуем в числа для безопасности
			const paymentPriceNum = Number(paymentPrice);
			const amountNum = Number(amount);

			if (
				isNaN(paymentPriceNum) ||
				isNaN(amountNum) ||
				paymentPriceNum <= 0 ||
				amountNum <= 0
			) {
				logger.error("Invalid payload data values", {
					payload,
					paymentPrice,
					amount,
					paymentPriceNum,
					amountNum,
				});
				throw new Error(
					"Invalid payload data: price and amount must be positive numbers"
				);
			}

			// Преобразуем userId в BigInt если нужно
			const userIdBigInt = BigInt(userId);

			// Создаем offer для записи в БД через marketService
			// Используем getResourceId для получения правильного ID ресурса
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userIdBigInt,
				price: paymentPriceNum,
				currency: "tgStars",
				itemId: this.getResourceId("darkMatter"), // Используем метод для получения ID ресурса
				itemType: "resource",
				amount: amountNum,
				resource: "darkMatter",
				offerType: "SYSTEM",
				txType: "DARK_MATTER_PURCHASE",
			};

			// Регистрируем offer через marketService для полного аудита
			// registerOffer уже добавляет валюту пользователю (строки 1830-1835 в market-service.js)
			const marketResult = await marketService.registerOffer(offerData);

			logger.info("Dark matter purchase payment completed", {
				userId: userIdBigInt.toString(),
				amount: amountNum,
				price: paymentPriceNum,
				paymentId: payment.telegram_payment_charge_id,
				marketOfferId: marketResult?.offer?.id,
			});

			return {
				success: true,
				message: "Dark matter purchase payment completed",
				data: {
					amount: amountNum,
					price: paymentPriceNum,
					marketOffer: marketResult,
				},
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
		const t = await sequelize.transaction();
		const shouldCommit = true;

		try {
			logger.info("Completing galaxy upgrade payment", {
				userId,
				payload,
				paymentId: payment.telegram_payment_charge_id,
			});

			// Extract upgrade data from payload (using short keys: p=price, gs=galaxySeed, ut=upgradeType, uv=upgradeValue)
			const paymentPrice = payload.p || payload.price;
			const galaxySeed = payload.gs || payload.galaxySeed;
			const upgradeType = payload.ut || payload.upgradeType;
			const upgradeValue = payload.uv || payload.upgradeValue;

			if (!paymentPrice || !galaxySeed || !upgradeType || !upgradeValue) {
				await t.rollback();
				throw new Error(
					"Missing required upgrade data: price (p), galaxySeed (gs), upgradeType (ut), upgradeValue (uv)"
				);
			}

			// Преобразуем userId в BigInt если нужно
			const userIdBigInt = BigInt(userId);

			// Validate upgrade type
			const validUpgradeTypes = ["name", "type", "color", "background"];
			if (!validUpgradeTypes.includes(upgradeType)) {
				await t.rollback();
				throw new Error(
					`Invalid upgrade type: ${upgradeType}. Must be one of: ${validUpgradeTypes.join(
						", "
					)}`
				);
			}

			// Find galaxy
			const galaxy = await Galaxy.findOne({
				where: { seed: galaxySeed, userId: userIdBigInt },
				transaction: t,
			});

			if (!galaxy) {
				await t.rollback();
				throw new Error("Galaxy not found or not owned by user");
			}

			// Apply upgrade
			const galaxyProperties = galaxy.galaxyProperties || {};
			const updateData = {
				galaxyProperties: galaxyProperties,
			};

			if (upgradeType === "name") {
				updateData.name = upgradeValue;
			} else if (upgradeType === "type") {
				galaxyProperties.type = upgradeValue;
				updateData.galaxyType = upgradeValue; // ✅ Также обновляем прямое поле для совместимости
				updateData.galaxyProperties = galaxyProperties;
			} else if (upgradeType === "color") {
				galaxyProperties.colorPalette = upgradeValue;
				updateData.colorPalette = upgradeValue; // ✅ Также обновляем прямое поле для совместимости
				updateData.galaxyProperties = galaxyProperties;
			} else if (upgradeType === "background") {
				galaxyProperties.background = upgradeValue;
				updateData.backgroundType = upgradeValue; // ✅ Также обновляем прямое поле для совместимости
				updateData.galaxyProperties = galaxyProperties;
			}

			// ✅ Явно обновляем поля для гарантии сохранения
			await galaxy.update(updateData, { transaction: t });

			// ✅ Перезагружаем галактику для получения обновленных данных
			await galaxy.reload({ transaction: t });

			logger.debug("Galaxy updated", {
				galaxySeed,
				upgradeType,
				upgradeValue,
				updatedFields: updateData,
				galaxyAfterUpdate: {
					name: galaxy.name,
					galaxyType: galaxy.galaxyType,
					colorPalette: galaxy.colorPalette,
					backgroundType: galaxy.backgroundType,
					galaxyProperties: galaxy.galaxyProperties,
				},
			});

			// Создаем offer для записи в БД через marketService для аудита
			const paymentPriceNum = Number(paymentPrice);
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userIdBigInt,
				price: paymentPriceNum,
				currency: "tgStars",
				itemId: BigInt(galaxy.id), // ID галактики
				itemType: "galaxy",
				amount: 0, // Для улучшения галактики не передаем ресурсы
				resource: "stars", // ✅ Используем валидное значение enum (amount = 0, поэтому не влияет на логику)
				offerType: "SYSTEM",
				txType: "GALAXY_UPGRADE",
			};

			// ✅ Валидация: убеждаемся, что resource установлен
			if (!offerData.resource || offerData.resource === "") {
				logger.error("Invalid resource in offerData", { offerData });
				await t.rollback();
				throw new Error(
					"Resource must be set to a valid enum value (stars, stardust, darkMatter)"
				);
			}

			logger.debug("Registering galaxy upgrade offer", {
				offerData,
				resource: offerData.resource,
				resourceType: typeof offerData.resource,
			});

			// Регистрируем offer через marketService для полного аудита
			const marketService = require("./market-service");
			const marketResult = await marketService.registerOffer(offerData, t);

			// ✅ Коммитим транзакцию после успешного сохранения
			if (shouldCommit) {
				await t.commit();
			}

			logger.info("Galaxy upgrade payment completed", {
				userId: userIdBigInt.toString(),
				galaxySeed,
				upgradeType,
				upgradeValue,
				paymentId: payment.telegram_payment_charge_id,
				marketOfferId: marketResult?.offer?.id,
				galaxyAfterUpgrade: {
					name: galaxy.name,
					galaxyType: galaxy.galaxyType,
					colorPalette: galaxy.colorPalette,
					backgroundType: galaxy.backgroundType,
					galaxyProperties: galaxy.galaxyProperties,
				},
			});

			return {
				success: true,
				message: "Galaxy upgrade payment completed",
				data: {
					galaxySeed,
					upgradeType,
					upgradeValue,
					galaxyName: galaxy.name,
				},
				marketOffer: marketResult,
			};
		} catch (error) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
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
			const resource = payload.r || payload.resource || "stars"; // ✅ Используем "stars" по умолчанию, если resource не указан
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: paymentPrice || 0,
				currency: "tgStars",
				itemId: result.package?.id || null,
				itemType: "package",
				amount: 0, // ✅ Устанавливаем amount в 0, так как валюта уже добавлена через usePackage
				resource: resource, // ✅ Используем валидное значение enum
				offerType: "SYSTEM",
				txType: "PACKAGE_PURCHASE",
			};

			// ✅ Валидация: убеждаемся, что resource установлен
			if (!offerData.resource || offerData.resource === "") {
				offerData.resource = "stars"; // Используем "stars" по умолчанию
			}

			// Регистрируем offer через marketService для полного аудита
			// ВАЖНО: amount = 0, поэтому валюта НЕ будет добавлена повторно
			// Валюта уже добавлена через usePackage выше
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
