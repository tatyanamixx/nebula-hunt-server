/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const galaxyService = require('../service/galaxy-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');
const marketService = require('../service/market-service');
const { Galaxy } = require('../models/models');

class GalaxyController {
	async createGalaxyWithOffer(req, res, next) {
		try {
			const buyerId = req.initdata.id;
			const { galaxyData, offerData } = req.body;

			// Валидация данных
			if (!galaxyData || !offerData) {
				return res.status(400).json({
					error: 'Missing required data: galaxyData and offerData',
				});
			}

			if (!galaxyData.seed || !galaxyData.galaxyProperties) {
				return res.status(400).json({
					error: 'Invalid galaxy data: seed and galaxyProperties are required',
				});
			}

			if (!offerData.price || !offerData.currency) {
				return res.status(400).json({
					error: 'Invalid offer data: price and currency are required',
				});
			}

			const result = await galaxyService.createGalaxyWithOffer(
				buyerId,
				galaxyData,
				offerData
			);

			logger.info('System galaxy with offer created', {
				buyerId,
				galaxyId: result.galaxy.id,
				offerId: result.offer.id,
			});

			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getUserGalaxies(req, res, next) {
		try {
			const userId = req.initdata.id;
			const galaxies = await galaxyService.getUserGalaxies(userId);
			return res.json(galaxies);
		} catch (e) {
			next(e);
		}
	}

	async getGalaxy(req, res, next) {
		try {
			const galaxyId = req.params.galaxyId;
			const galaxy = await galaxyService.getGalaxy(galaxyId);
			return res.json(galaxy);
		} catch (e) {
			next(e);
		}
	}

	async transferStarsToUserGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { galaxyData, offer }	 = req.body;
			const galaxy = await galaxyService.transferStarsToUser(
				userId,
				galaxyData,
				offer
			);
			return res.json(galaxy);
		} catch (e) {
			next(e);
		}
	}

	async deleteGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const galaxyId = req.params.galaxyId;
			const result = await galaxyService.deleteGalaxy(userId, galaxyId);
			logger.info('Galaxy deleted', { userId, galaxyId });
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async addStarsToUserGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { offerData } = req.body;

			// Проверяем, что галактика принадлежит пользователю
			const galaxy = await Galaxy.findOne({
				where: { id: galaxyId, userId },
			});

			if (!galaxy) {
				return res.status(404).json({
					error: 'Galaxy not found or not owned by user',
				});
			}

			// Регистрируем передачу звезд через marketService
			const result = await galaxyService.transferStarsToUser(
				userId,
				offerData
			);

			logger.info('Stars added to galaxy', {
				userId,
				offerData,
			});

			return res.json({
				success: true,
				galaxy: result.galaxy,
				transaction: result.transaction,
			});
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new GalaxyController();
