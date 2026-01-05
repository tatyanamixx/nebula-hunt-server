/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const galaxyService = require("../service/galaxy-service");
const ApiError = require("../exceptions/api-error");
const logger = require("../service/logger-service");
const marketService = require("../service/market-service");
const { Galaxy } = require("../models/models");

class GalaxyController {
	async createGalaxyWithOffer(req, res, next) {
		try {
			const buyerId = req.initdata.id;
			const { galaxyData, offerData } = req.body;

			// Валидация данных
			if (!galaxyData || !offerData) {
				return res.status(400).json({
					message: "Missing required data: galaxyData and offerData",
					errorCode: "VAL_005",
					severity: "LOW",
				});
			}

			if (!galaxyData.seed || !galaxyData.galaxyProperties) {
				return res.status(400).json({
					message:
						"Invalid galaxy data: seed and galaxyProperties are required",
					errorCode: "VAL_003",
					severity: "MEDIUM",
				});
			}

			const result = await galaxyService.createGalaxyWithOffer(galaxyData, {
				...offerData,
				buyerId,
			});

			logger.info("System galaxy with offer created", {
				buyerId,
				galaxyId: result.galaxy?.id,
				offerId: result.offerOut?.id,
			});

			logger.debug("Galaxy controller response", result);

			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getUserGalaxies(req, res, next) {
		try {
			const userId = req.initdata.id;
			const galaxiesResponse = await galaxyService.getUserGalaxies(userId);

			logger.info("User galaxies retrieved", {
				userId,
				galaxyCount: galaxiesResponse.galaxies.length,
			});

			return res.json({
				success: true,
				data: {
					galaxies: galaxiesResponse.galaxies,
					galaxiesThatGaveReward: galaxiesResponse.galaxiesThatGaveReward,
				},
			});
		} catch (e) {
			next(e);
		}
	}

	async getUserGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const seed = req.params.seed;
			const galaxy = await galaxyService.getUserGalaxy(userId, seed);
			return res.json(galaxy);
		} catch (e) {
			next(e);
		}
	}

	async deleteUserGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const seed = req.params.seed;
			const result = await galaxyService.deleteGalaxy(userId, seed);
			logger.info("Galaxy deleted", { userId, seed });
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async transferStarsToUserGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { offerData } = req.body;

			// Проверяем, что галактика принадлежит пользователю
			const galaxy = await Galaxy.findOne({
				where: { id: galaxyId, userId },
			});

			if (!galaxy) {
				return res.status(404).json({
					error: "Galaxy not found or not owned by user",
				});
			}

			// Регистрируем передачу звезд через marketService
			const result = await galaxyService.transferStarsToUser(
				userId,
				offerData
			);

			logger.info("Stars added to galaxy", {
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

	async getShowGalaxies(req, res, next) {
		try {
			const userId = req.initdata.id;
			const galaxies = await galaxyService.getShowGalaxies(userId);
			return res.json(galaxies);
		} catch (e) {
			next(e);
		}
	}

	async updateGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const seed = req.params.seed;
			const updates = req.body;

			// Проверяем, что галактика принадлежит пользователю
			const galaxy = await Galaxy.findOne({
				where: { seed, userId },
			});

			if (!galaxy) {
				return res.status(404).json({
					error: "Galaxy not found or not owned by user",
				});
			}

			// Обновляем галактику
			const result = await galaxyService.updateGalaxy(seed, updates, userId);

			logger.info("Galaxy updated", { userId, seed, updates });

			return res.json({
				success: true,
				galaxy: result,
			});
		} catch (e) {
			next(e);
		}
	}

	async upgradeGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const seed = req.params.seed;
			const { upgradeType, upgradeValue } = req.body;

			// Validate upgrade type
			const validUpgradeTypes = ["name", "type", "color", "background"];
			if (!validUpgradeTypes.includes(upgradeType)) {
				return res.status(400).json({
					success: false,
					error: `Invalid upgrade type. Must be one of: ${validUpgradeTypes.join(
						", "
					)}`,
				});
			}

			// Validate required fields
			if (!upgradeValue) {
				return res.status(400).json({
					success: false,
					error: "upgradeValue is required",
				});
			}

			// Check if galaxy exists and belongs to user
			const galaxy = await Galaxy.findOne({
				where: { seed, userId },
			});

			if (!galaxy) {
				return res.status(404).json({
					success: false,
					error: "Galaxy not found or not owned by user",
				});
			}

			// Apply upgrade based on type
			const galaxyProperties = galaxy.galaxyProperties || {};

			if (upgradeType === "name") {
				galaxy.name = upgradeValue;
			} else if (upgradeType === "type") {
				galaxyProperties.type = upgradeValue;
			} else if (upgradeType === "color") {
				galaxyProperties.colorPalette = upgradeValue;
			} else if (upgradeType === "background") {
				galaxyProperties.background = upgradeValue;
			}

			// Update galaxy properties
			galaxy.galaxyProperties = galaxyProperties;
			await galaxy.save();

			logger.info("Galaxy upgraded", {
				userId,
				seed,
				upgradeType,
				upgradeValue,
			});

			return res.json({
				success: true,
				message: "Galaxy upgraded successfully",
				galaxy: {
					seed: galaxy.seed,
					name: galaxy.name,
					galaxyProperties: galaxy.galaxyProperties,
				},
			});
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new GalaxyController();
