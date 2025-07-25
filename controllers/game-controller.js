/**
 * Game Controller for game mechanics operations
 * Created by Claude on 15.07.2025
 */
const gameService = require('../service/game-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class GameController {
	/**
	 * Register upgrade payment
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerUpgradePayment(req, res, next) {
		try {
			const { userId, nodeId, amount, resource } = req.body;

			// Validate required fields
			if (!userId || !nodeId || !amount || !resource) {
				throw ApiError.BadRequest(
					'Missing required fields: userId, nodeId, amount, resource'
				);
			}

			// Validate amount is positive
			if (amount <= 0) {
				throw ApiError.BadRequest('Amount must be positive');
			}

			const result = await gameService.registerUpgradePayment({
				userId,
				nodeId,
				amount,
				resource,
			});

			logger.info('Upgrade payment registered successfully', {
				userId,
				nodeId,
				amount,
				resource,
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
	 * Register task reward
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerTaskReward(req, res, next) {
		try {
			const userId = req.initData.id;
			const { slug } = req.params;

			// Validate required fields
			if (!slug) {
				throw ApiError.BadRequest(
					'Missing required fields: slug'
				);
			}

			// Validate amount is positive


			const result = await gameService.registerTaskReward({
				userId,
				slug,
			});

			logger.info('Task reward registered successfully', {
				userId,
				slug,
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
	 * Register event reward
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerEventReward(req, res, next) {
		try {
			const { userId, eventId, amount, resource } = req.body;

			// Validate required fields
			if (!userId || !eventId || !amount || !resource) {
				throw ApiError.BadRequest(
					'Missing required fields: userId, eventId, amount, resource'
				);
			}

			// Validate amount is positive
			if (amount <= 0) {
				throw ApiError.BadRequest('Amount must be positive');
			}

			const result = await gameService.registerEventReward({
				userId,
				eventId,
				amount,
				resource,
			});

			logger.info('Event reward registered successfully', {
				userId,
				eventId,
				amount,
				resource,
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
	 * Register farming reward
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerFarmingReward(req, res, next) {
		try {
			const userId = req.initData.id;
			const { offerData} = req.body;

			// Validate required fields
			if (
				!offerData ||
				!Array.isArray(offerData) ||
				offerData.length === 0
			) {
				throw ApiError.BadRequest(
					'offerData must be a non-empty array'
				);
			}

			// Validate each offer in the array
			for (const offer of offerData) {
				if (!offer.amount || !offer.resource) {
					throw ApiError.BadRequest(
						'Each offer must have amount and resource'
					);
				}

				if (offer.amount <= 0) {
					throw ApiError.BadRequest(
						'Amount must be positive for all offers'
					);
				}
			}

			const result = await gameService.registerFarmingReward(
				userId,
				offerData,
			);

			logger.info('Farming reward registered successfully', {
				userId,
				offerCount: offerData.length,
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
	 * Register stars transfer
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerStarsTransferToGalaxy(req, res, next) {
		try {
			const userId = req.initData.id;
			const { offer, galaxySeed } = req.body;

			// Validate required fields
			if (
				!offer ||
				!galaxySeed ||
				!offer.amount ||
				!offer.resource
			) {
				throw ApiError.BadRequest(
				'Missing required fields: offer, galaxySeed, amount, resource'
				);
			}

			// Validate amount is positive
			if (offer.amount <= 0) {
				throw ApiError.BadRequest('Amount must be positive');
			}

			const result = await gameService.registerStarsTransferToGalaxy(userId, offer, galaxySeed);

			logger.info('Stars transfer registered successfully', {
				userId,
				galaxySeed,
				amount: offer.amount,
				resource: offer.resource,
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
	 * Create galaxy with offer
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async createGalaxyWithOffer(req, res, next) {
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

			const result = await gameService.createGalaxyWithOffer(
				galaxyData,
				offer
			);

			logger.info('Galaxy with offer created successfully', {
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
	async transferStarsToUser(req, res, next) {
		try {
			const { userId, galaxyData, offer } = req.body;

			// Validate required fields
			if (!userId || !galaxyData || !offer) {
				throw ApiError.BadRequest(
					'Missing required fields: userId, galaxyData, offer'
				);
			}

			if (!offer.seed) {
				throw ApiError.BadRequest('Offer seed is required');
			}

			if (!offer.amount || !offer.resource) {
				throw ApiError.BadRequest(
					'Offer must have amount and resource'
				);
			}

			// Validate amount is positive
			if (offer.amount <= 0) {
				throw ApiError.BadRequest('Amount must be positive');
			}

			const result = await gameService.transferStarsToUser(
				userId,
				galaxyData,
				offer
			);

			logger.info('Stars transferred to user successfully', {
				userId,
				seed: offer.seed,
				amount: offer.amount,
				resource: offer.resource,
			});

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}
}

module.exports = new GameController();
