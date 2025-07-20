/**
 * created by Tatyana Mikhniukevich on 08.05.2025
 */
const { User, Galaxy } = require('../models/models');
const logger = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const { Op } = require('sequelize');
const sequelize = require('../db');
const { GALAXY_BASE_PRICE } = require('../config/constants');
const marketService = require('./market-service');
const { SYSTEM_USER_ID } = require('../config/constants');
const { GALAXY_LIMIT_FOR_USER } = require('../config/constants');

class GalaxyService {
	async getUserGalaxies(userId) {
		const t = await sequelize.transaction();

		try {
			const galaxiesRaw = await Galaxy.findAll({
				where: { userId },
				order: [['starCurrent', 'DESC']],
				transaction: t,
			});

			if (!galaxiesRaw) {
				await t.commit();
				return [];
			}

			const galaxies = galaxiesRaw.map((item) => item.toJSON());

			await t.commit();
			return galaxies;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user galaxies: ${err.message}`
			);
		}
	}

	async getShowGalaxies(userId) {
		const t = await sequelize.transaction();

		try {
			// Get total count of available galaxies
			const count = await Galaxy.count({
				where: {
					userId: { [Op.ne]: userId },
					active: true,
				},
				transaction: t,
			});

			if (count === 0) {
				await t.commit();
				return {
					info: { count: 0, page: 0 },
					galaxies: [],
				};
			}

			// Calculate pagination
			const itemsPerPage = GALAXY_LIMIT_FOR_USER;
			const totalPages = Math.ceil(count / itemsPerPage);
			const randomPage = Math.floor(Math.random() * totalPages);
			const offset = randomPage * itemsPerPage;

			// Get random selection of galaxies
			const galaxiesRaw = await Galaxy.findAll({
				where: {
					userId: { [Op.ne]: userId },
					active: true,
				},
				order: sequelize.random(),
				offset: offset,
				limit: itemsPerPage,
				include: [
					{
						model: User,
						attributes: ['username', 'role', 'id'],
					},
				],
				transaction: t,
			});

			const galaxies = galaxiesRaw.map((item) => item.toJSON());

			await t.commit();
			return {
				info: {
					count,
					totalPages,
					currentPage: randomPage,
					itemsPerPage,
				},
				galaxies,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get show galaxies: ${err.message}`
			);
		}
	}

	// one galaxy
	async getUserGalaxy(userId, seed) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findOne({
				where: { userId, seed },
				include: [
					{
						model: User,
						attributes: ['username', 'id'],
					},
				],
				transaction: t,
			});

			if (!galaxy) {
				await t.rollback();
				throw ApiError.BadRequest('Galaxy not found');
			}

			await t.commit();
			return galaxy;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get galaxy: ${err.message}`);
		}
	}



	/**
	 * Создать галактику от имени SYSTEM и создать оферту с инвойсом
	 * @param {Object} galaxyData - данные галактики
	 * @param {number} buyerId - ID покупателя
	 * @param {Object} offerData - данные оферты (price, currency, expiresAt)
	 */
	async createGalaxyWithOffer(userId, galaxyData, offer) {
		const t = await sequelize.transaction();

		try {
			// 1. Создаем галактику от имени SYSTEM
			const [galaxy, created] = await Galaxy.findOrCreate({
				where: {
					seed: galaxyData.seed,
				},
				defaults: {
					userId: userId,
					starMin: galaxyData.starMin || 100,
					starCurrent: galaxyData.starCurrent || 100,
					price: galaxyData.price || GALAXY_BASE_PRICE,
					seed: galaxyData.seed || '',
					particleCount: galaxyData.particleCount || 100,
					onParticleCountChange:
						galaxyData.onParticleCountChange || true,
					galaxyProperties: galaxyData.galaxyProperties || {},
					active: true,
				},
				transaction: t,
			});
			if (!created) {
				throw ApiError.BadRequest('Galaxy already exists');
			} else {
				await galaxy.save({ transaction: t });
				await t.commit();
				logger.debug('galaxy created');
			}

			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: offer.price,
				currency: offer.currency,
				itemId: galaxy.id,
				itemType: 'galaxy',
				amount: galaxy.starCurrent,
				resource: 'stars',
				offerType: 'SYSTEM',
				status: 'PENDING',
			};

			const { offerOut, marketTransaction, payment, transferStars } =
				await marketService.registerGalaxyOffer(offerData);

			return {
				galaxy,
				offerOut,
				marketTransaction,
				payment,
				transferStars,
			};
		} catch (err) {
			await t.rollback();
			logger.error('Error in createSystemGalaxyWithOffer', err);
			throw ApiError.Internal(
				`Failed to create system galaxy with offer: ${err.message}`
			);
		}
	}

	async deleteGalaxy(userId, seed) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findOne({
				where: { seed, userId },
				transaction: t,
			});

			if (!galaxy) {
				await t.rollback();
				throw ApiError.NotFound(
					'Galaxy not found or not owned by user'
				);
			}

			// Hard delete
			await galaxy.destroy({ transaction: t });

			await t.commit();
			return {
				success: true,
				message: 'Galaxy deleted successfully',
				galaxyId: galaxy.id,
			};
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to delete galaxy: ${err.message}`);
		}
	}

	async transferStarsToUser(userId, galaxyData, offer) {
		const t = await sequelize.transaction();

		try {
			// Проверяем, что галактика принадлежит пользователю
			const galaxy = await Galaxy.findOne({
				where: { seed: offer.seed },
				transaction: t,
			});
			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found');
			}

			// const user = await User.findOne({
			// 	where: { id: userId },
			// 	transaction: t,
			// });

			// Validate stars value
			if (galaxy.starCurrent < 0) {
				throw ApiError.BadRequest('Stars cannot be negative');
			}

			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: offer.price,
				currency: offer.currency,
				itemId: galaxy.id,
				itemType: 'galaxy',
				amount: offer.amount,
				resource: offer.resource,
				offerType: 'SYSTEM',
				status: 'COMPLETED',
			};
			// Регистрируем передачу звезд через marketService
			const result = await marketService.registerStarsTransfer(offerData);

			galaxy.starCurrent = galaxyData.starCurrent;
			galaxy.particleCount = galaxyData.particleCount;
			galaxy.onParticleCountChange = galaxyData.onParticleCountChange;
			galaxy.galaxyProperties = galaxyData.galaxyProperties || {};
			await galaxy.save({ transaction: t });

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to transfer stars to user: ${err.message}`
			);
		}
	}
}

module.exports = new GalaxyService();
