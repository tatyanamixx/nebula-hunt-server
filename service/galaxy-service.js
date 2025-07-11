/**
 * created by Tatyana Mikhniukevich on 08.05.2025
 */
const { User, Galaxy } = require('../models/models');
const loggerService = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const { Op } = require('sequelize');
const sequelize = require('../db');

class GalaxyService {
	async getUserGalaxies(id) {
		const t = await sequelize.transaction();

		try {
			const galaxiesRaw = await Galaxy.findAll({
				where: { userId: id },
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

	async getShowGalaxies(id) {
		const t = await sequelize.transaction();

		try {
			// Get total count of available galaxies
			const count = await Galaxy.count({
				where: {
					userId: { [Op.ne]: id },
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
			const itemsPerPage = 20;
			const totalPages = Math.ceil(count / itemsPerPage);
			const randomPage = Math.floor(Math.random() * totalPages);
			const offset = randomPage * itemsPerPage;

			// Get random selection of galaxies
			const galaxiesRaw = await Galaxy.findAll({
				where: {
					userId: { [Op.ne]: id },
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
	async getGalaxy(id) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findByPk(id, {
				include: [
					{
						model: User,
						attributes: ['username', 'role', 'id'],
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

	// create one galaxy
	async createUserGalaxy(userId, galaxyData) {
		const t = await sequelize.transaction();

		try {
			// Validate galaxy data
			if (!galaxyData.seed || !galaxyData.galaxyProperties) {
				throw ApiError.BadRequest('Invalid galaxy data structure');
			}
			loggerService.info(userId, galaxyData);
			const [galaxy, created] = await Galaxy.findOrCreate({
				where: {
					seed: galaxyData.seed,
				},
				defaults: {
					userId: userId,
					starMin: galaxyData.starMin || 100,
					starCurrent: galaxyData.starCurrent || 100,
					price: galaxyData.price || 100,
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
				loggerService.info(userId, 'galaxy already exists');
				// await t.rollback();
				// throw ApiError.BadRequest('Galaxy already exists');
			}

			await t.commit();
			return galaxy;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to create galaxy: ${err.message}`);
		}
	}

	// save new param for galaxy
	async updateUserGalaxy(userId, galaxyData) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findOne({
				where: { seed: galaxyData.seed },
				transaction: t,
			});
			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found');
			}

			const user = await User.findOne({
				where: { id: userId },
				transaction: t,
			});

			// Validate stars value
			if (galaxyData.starCurrent < 0) {
				throw ApiError.BadRequest('Stars cannot be negative');
			}
			galaxy.starCurrent = galaxyData.starCurrent;
			galaxy.price = galaxyData.price;

			galaxy.starCurrent = galaxyData.starCurrent;
			galaxy.particleCount = galaxyData.particleCount;
			galaxy.onParticleCountChange = galaxyData.onParticleCountChange;
			galaxy.galaxyProperties = galaxyData.galaxyProperties;
			await galaxy.save({ transaction: t });

			await t.commit();
			return galaxy;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update galaxy stars: ${err.message}`
			);
		}
	}

	// save new param for galaxy
	async updateGalaxyOwner(galaxyData, id) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findOne(galaxyData.seed, {
				transaction: t,
			});
			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found');
			}

			const newUser = await User.findByPk(id, {
				transaction: t,
			});
			if (!newUser) {
				throw ApiError.BadRequest('New owner not found');
			}

			const oldUserId = galaxy.userId;
			galaxy.userId = newUser.id;
			await galaxy.save({ transaction: t });

			await t.commit();
			return galaxy;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update galaxy owner: ${err.message}`
			);
		}
	}

	async batchCreateGalaxies(userId, galaxies) {
		const t = await sequelize.transaction();

		try {
			const createdGalaxies = await Promise.all(
				galaxies.map((galaxyData) =>
					Galaxy.findOrCreate({
						where: {
							seed: galaxyData.seed,
						},
						defaults: {
							userId: userId,
							starMin: galaxyData.starMin || 100,
							starCurrent: galaxyData.starCurrent || 100,
							price: galaxyData.price || 100,
							seed: galaxyData.seed || '',
							particleCount: galaxyData.particleCount || 100,
							onParticleCountChange:
								galaxyData.onParticleCountChange || true,
							galaxyProperties: galaxyData.galaxyProperties || {},
							active: true,
						},
						transaction: t,
					})
				)
			);

			await t.commit();
			return createdGalaxies;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to batch create galaxies: ${err.message}`
			);
		}
	}

	/**
	 * Создать галактику от имени SYSTEM и создать оферту с инвойсом
	 * @param {Object} galaxyData - данные галактики
	 * @param {number} buyerId - ID покупателя
	 * @param {Object} offerData - данные оферты (price, currency, expiresAt)
	 */
	async createSystemGalaxyWithOffer(galaxyData, buyerId, offerData) {
		const t = await sequelize.transaction();

		try {
			const { SYSTEM_USER_ID } = require('../config/constants');

			// 1. Создаем галактику от имени SYSTEM
			const [galaxy, created] = await Galaxy.findOrCreate({
				where: {
					seed: galaxyData.seed,
				},
				defaults: {
					userId: SYSTEM_USER_ID,
					starMin: galaxyData.starMin || 100,
					starCurrent: galaxyData.starCurrent || 100,
					price: galaxyData.price || 100,
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
			}

			// 2. Создаем оферту на продажу галактики
			const { MarketOffer } = require('../models/models');
			const offer = await MarketOffer.create(
				{
					sellerId: SYSTEM_USER_ID,
					itemType: 'galaxy',
					itemId: galaxy.id,
					price: offerData.price,
					currency: offerData.currency,
					offerType: 'SYSTEM',
					expiresAt: offerData.expiresAt,
					status: 'ACTIVE',
				},
				{ transaction: t }
			);

			// 3. Создаем инвойс для покупателя
			const {
				MarketTransaction,
				PaymentTransaction,
			} = require('../models/models');
			const transaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: buyerId,
					sellerId: SYSTEM_USER_ID,
					status: 'PENDING',
				},
				{ transaction: t }
			);

			const payment = await PaymentTransaction.create(
				{
					marketTransactionId: transaction.id,
					fromAccount: buyerId,
					toAccount: SYSTEM_USER_ID,
					amount: offerData.price,
					currency: offerData.currency,
					txType: 'BUYER_TO_CONTRACT',
					status: 'PENDING',
				},
				{ transaction: t }
			);

			await t.commit();
			return { galaxy, offer, transaction, payment };
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to create system galaxy with offer: ${err.message}`
			);
		}
	}

	async deleteGalaxy(userId, galaxyId) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findOne({
				where: {
					id: galaxyId,
					userId: userId,
				},
				transaction: t,
			});

			if (!galaxy) {
				await t.rollback();
				throw ApiError.NotFound(
					'Galaxy not found or not owned by user'
				);
			}

			// Soft delete by setting active to false
			galaxy.active = false;
			await galaxy.save({ transaction: t });

			await t.commit();
			return {
				success: true,
				message: 'Galaxy deleted successfully',
				galaxyId: galaxyId,
			};
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to delete galaxy: ${err.message}`);
		}
	}
}

module.exports = new GalaxyService();
