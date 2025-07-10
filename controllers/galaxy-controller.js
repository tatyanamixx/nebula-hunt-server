/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const galaxyService = require('../service/galaxy-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');
const marketService = require('../service/market-service');
const { Galaxy } = require('../models/models');

class GalaxyController {
	async createGalaxy(req, res, next) {
		try {
			const id = req.initdata.id;
			const galaxyData = req.body;
			const galaxy = await galaxyService.createGalaxy(id, galaxyData);
			logger.info('Galaxy created', { userId: id, galaxy: galaxyData });
			return res.json(galaxy);
		} catch (e) {
			next(e);
		}
	}

	async getGalaxies(req, res, next) {
		try {
			const id = req.initdata.id;
			const galaxies = await galaxyService.getUserGalaxies(id);
			return res.json(galaxies);
		} catch (e) {
			next(e);
		}
	}

	async updateGalaxy(req, res, next) {
		try {
			const id = req.initdata.id;
			const galaxyData = req.body;
			const galaxy = await galaxyService.updateGalaxy(id, galaxyData);
			return res.json(galaxy);
		} catch (e) {
			next(e);
		}
	}

	async addStarsToGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { galaxyId, amount } = req.body;

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
			const result = await marketService.registerGalaxyStarsTransfer({
				userId,
				galaxyId,
				amount,
				currency: 'tgStars',
			});

			logger.info('Stars added to galaxy', {
				userId,
				galaxyId,
				amount,
				newStarCount: result.galaxy.starCurrent,
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

	async createSystemGalaxyWithOffer(req, res, next) {
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

			const result = await galaxyService.createSystemGalaxyWithOffer(
				galaxyData,
				buyerId,
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
}

module.exports = new GalaxyController();
