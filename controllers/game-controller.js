/**
 * Game Controller for game mechanics operations
 * Created by Claude on 15.07.2025
 */
const gameService = require('../service/game-service');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const logger = require('../service/logger-service');

class GameController {
	/**
	 * Register farming reward for internal currency
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerFarmingReward(req, res, next) {
		try {
			const userId = req.initData.id;
			const { offerData } = req.body;

			logger.debug('registerFarmingReward request', {
				userId,
				offerData,
			});

			// Validate required fields
			if (!offerData) {
				throw ApiError.BadRequest(
					'offerData is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate array structure
			if (!Array.isArray(offerData)) {
				throw ApiError.BadRequest(
					'offerData must be an array',
					ERROR_CODES.VALIDATION.INVALID_FARMING_DATA
				);
			}

			// Validate array length (must be exactly 2 elements)
			if (offerData.length !== 2) {
				throw ApiError.BadRequest(
					'offerData must contain exactly 2 elements: stardust and darkMatter',
					ERROR_CODES.VALIDATION.INVALID_FARMING_DATA
				);
			}

			// Basic validation for each offer (detailed validation is in service)
			for (const offer of offerData) {
				if (!offer || typeof offer !== 'object') {
					throw ApiError.BadRequest(
						'Each farming reward must be an object',
						ERROR_CODES.VALIDATION.INVALID_FARMING_DATA
					);
				}

				if (!offer.resource || !offer.amount) {
					throw ApiError.BadRequest(
						'Each farming reward must have resource and amount',
						ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
					);
				}

				if (typeof offer.amount !== 'number' || offer.amount <= 0) {
					throw ApiError.BadRequest(
						'Amount must be a positive number',
						ERROR_CODES.VALIDATION.INVALID_AMOUNT
					);
				}
			}

			const result = await gameService.registerFarmingReward(
				userId,
				offerData
			);

			logger.info('Farming reward registered successfully', {
				userId,
				offerCount: offerData.length,
				rewards: offerData.map((o) => ({
					resource: o.resource,
					amount: o.amount,
				})),
			});

			res.status(200).json({
				success: true,
				message: 'Farming rewards registered successfully',
				data: result,
			});
		} catch (error) {
			logger.error('Failed to register farming reward', {
				userId: req.initData?.id,
				error: error.message,
				offerData: req.body?.offerData,
			});
			next(error);
		}
	}

	/**
	 * Create galaxy for sale
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async createGalaxyForSale(req, res, next) {
		try {
			const { galaxyData, offer } = req.body;

			// Validate required fields
			if (!galaxyData || !offer) {
				throw ApiError.BadRequest(
					'Missing required fields: galaxyData, offer'
				);
			}

			if (!galaxyData.seed) {
				throw ApiError.BadRequest('Galaxy seed is required');
			}

			if (!offer.buyerId || !offer.price || !offer.currency) {
				throw ApiError.BadRequest(
					'Offer must have buyerId, price, and currency'
				);
			}

			// Validate price is positive
			if (offer.price <= 0) {
				throw ApiError.BadRequest('Price must be positive');
			}

			const result = await gameService.createGalaxyForSale(
				galaxyData,
				offer
			);

			logger.info('Galaxy for sale created successfully', {
				seed: galaxyData.seed,
				buyerId: offer.buyerId,
				price: offer.price,
				currency: offer.currency,
			});

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Transfer stars to user
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */

	/**
	 * Register transfer stardust to galaxy - create offer for galaxy purchase
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerTransferStardustToGalaxy(req, res, next) {
		try {
			const { userId, galaxy, reward } = req.body;

			logger.debug('registerTransferStardustToGalaxy request', {
				userId,
				galaxy,
				reward,
			});

			// Validate required fields
			if (!userId) {
				throw ApiError.BadRequest(
					'userId is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (!galaxy) {
				throw ApiError.BadRequest(
					'Galaxy data is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (!reward) {
				throw ApiError.BadRequest(
					'Reward data is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate galaxy data
			if (!galaxy.seed) {
				throw ApiError.BadRequest(
					'Galaxy seed is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate reward data
			if (
				!reward.currency ||
				!reward.price ||
				!reward.resource ||
				!reward.amount
			) {
				throw ApiError.BadRequest(
					'Reward must have currency, price, resource, and amount',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate price and amount are positive
			if (reward.price <= 0) {
				throw ApiError.BadRequest(
					'Price must be positive',
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			if (reward.amount <= 0) {
				throw ApiError.BadRequest(
					'Amount must be positive',
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			const result = await gameService.registerTransferStardustToGalaxy(
				userId,
				galaxy,
				reward
			);

			logger.info('Galaxy purchase offer registered successfully', {
				userId,
				galaxySeed: galaxy.seed,
				price: reward.price,
				currency: reward.currency,
				amount: reward.amount,
				resource: reward.resource,
			});

			res.status(200).json({
				success: true,
				message: 'Galaxy purchase offer registered successfully',
				data: result.data,
			});
		} catch (error) {
			logger.error('Failed to register transfer stardust to galaxy', {
				userId: req.body?.userId,
				error: error.message,
				galaxy: req.body?.galaxy,
				reward: req.body?.reward,
			});
			next(error);
		}
	}

	/**
	 * Claim daily reward for user
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async claimDailyReward(req, res, next) {
		try {
			const userId = req.initData.id;

			logger.debug('claimDailyReward request', {
				userId,
			});

			const result = await gameService.claimDailyReward(userId);

			logger.info('Daily reward claimed successfully', {
				userId,
				currentStreak: result.data.currentStreak,
				maxStreak: result.data.maxStreak,
				rewards: result.data.rewards,
			});

			res.status(200).json({
				success: true,
				message: 'Daily reward claimed successfully',
				data: result.data,
			});
		} catch (error) {
			logger.error('Failed to claim daily reward', {
				userId: req.initData?.id,
				error: error.message,
			});
			next(error);
		}
	}

	/**
	 * Register generated galaxy when previous galaxy is filled with stars
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerGeneratedGalaxy(req, res, next) {
		try {
			const userId = req.initData.id;
			const { galaxyData } = req.body;

			logger.debug('registerGeneratedGalaxy request', {
				userId,
				galaxyData,
			});

			// Validate required fields
			if (!galaxyData) {
				throw ApiError.BadRequest(
					'galaxyData is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate galaxy data structure
			if (!galaxyData.seed) {
				throw ApiError.BadRequest(
					'Galaxy seed is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			const result = await gameService.registerGeneratedGalaxy(
				userId,
				galaxyData
			);

			logger.info('Generated galaxy registered successfully', {
				userId,
				galaxySeed: galaxyData.seed,
				galaxyId: result.data?.galaxy?.id,
			});

			res.status(200).json({
				success: true,
				message: 'Generated galaxy registered successfully',
				data: result.data,
			});
		} catch (error) {
			logger.error('Failed to register generated galaxy', {
				userId: req.initData?.id,
				error: error.message,
				galaxyData: req.body?.galaxyData,
			});
			next(error);
		}
	}

	/**
	 * Register captured galaxy with tgStars offer
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerCapturedGalaxy(req, res, next) {
		try {
			const userId = req.initData.id;
			const { galaxyData, offer } = req.body;

			logger.debug('registerCapturedGalaxy request', {
				userId,
				galaxyData,
				offer,
			});

			// Validate required fields
			if (!galaxyData) {
				throw ApiError.BadRequest(
					'galaxyData is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (!offer) {
				throw ApiError.BadRequest(
					'offer is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate galaxy data structure
			if (!galaxyData.seed) {
				throw ApiError.BadRequest(
					'Galaxy seed is required',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate offer structure
			if (!offer.price || !offer.currency) {
				throw ApiError.BadRequest(
					'Offer must have price and currency',
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate price is positive
			if (offer.price <= 0) {
				throw ApiError.BadRequest(
					'Price must be positive',
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			const result = await gameService.registerCapturedGalaxy(
				userId,
				galaxyData,
				offer
			);

			logger.info('Captured galaxy registered successfully', {
				userId,
				galaxySeed: galaxyData.seed,
				price: offer.price,
				currency: offer.currency,
				galaxyId: result.data?.galaxy?.id,
			});

			res.status(200).json({
				success: true,
				message: 'Captured galaxy registered successfully',
				data: result.data,
			});
		} catch (error) {
			logger.error('Failed to register captured galaxy', {
				userId: req.initData?.id,
				error: error.message,
				galaxyData: req.body?.galaxyData,
				offer: req.body?.offer,
			});
			next(error);
		}
	}
}

module.exports = new GameController();
