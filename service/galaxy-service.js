const { User, Galaxy } = require('../models/models');
const loggerService = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const { Op } = require('sequelize');
const sequelize = require('../db');

class GalaxyService {
	async getUserGalaxies(userId) {
		const t = await sequelize.transaction();

		try {
			const galaxiesRaw = await Galaxy.findAll({
				where: { userId: userId },
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

	async getShowGalaxies(tmaId) {
		const t = await sequelize.transaction();

		try {
			const user = await User.findOne({
				where: { tmaId: tmaId },
				transaction: t,
			});
			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
			}

			// Get total count of available galaxies
			const count = await Galaxy.count({
				where: {
					userId: { [Op.ne]: user.id },
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
					userId: { [Op.ne]: user.id },
					active: true,
				},
				order: sequelize.random(),
				offset: offset,
				limit: itemsPerPage,
				include: [
					{
						model: User,
						attributes: ['tmaUsername', 'role', 'tmaId'],
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
						attributes: ['tmaUsername', 'role', 'tmaId'],
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
	async createGalaxy(userId, galaxyData) {
		const t = await sequelize.transaction();

		try {
			// Validate galaxy data
			if (!galaxyData.galaxyData || !galaxyData.galaxySetting) {
				throw ApiError.BadRequest('Invalid galaxy data structure');
			}

			const galaxy = await Galaxy.create(
				{
					userId: userId,
					starMin: galaxyData.starMin || 100,
					starCurrent: galaxyData.starCurrent || 100,
					price: galaxyData.price || 100,
					galaxySetting: galaxyData.galaxySetting,
					active: true,
				},
				{ transaction: t }
			);

			
			await t.commit();
			return galaxy;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to create galaxy: ${err.message}`);
		}
	}

	// save new param for galaxy
	async updateGalaxyStars(id, starCurrent) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findByPk(id, { transaction: t });
			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found');
			}

			const user = await User.findOne({
				where: { id: galaxy.userId },
				transaction: t,
			});

			// Validate stars value
			if (starCurrent < 0) {
				throw ApiError.BadRequest('Stars cannot be negative');
			}

			galaxy.starCurrent = starCurrent;
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
	async updateGalaxyOwner(id, newUserId) {
		const t = await sequelize.transaction();

		try {
			const galaxy = await Galaxy.findByPk(id, { transaction: t });
			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found');
			}

			const newUser = await User.findOne({
				where: { id: newUserId },
				transaction: t,
			});
			if (!newUser) {
				throw ApiError.BadRequest('New owner not found');
			}

			const oldUserId = galaxy.userId;
			galaxy.userId = newUserId;
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
					Galaxy.create(
						{
							userId: userId,
							starMin: galaxyData.starMin || 100,
							starCurrent: galaxyData.starCurrent || 100,
							price: galaxyData.price || 100,
							galaxySetting: galaxyData.galaxySetting,
							active: true,
						},
						{ transaction: t }
					)
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
}

module.exports = new GalaxyService();
