const { User, Galaxy } = require('../models/models');
const loggerService = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const { Op } = require('sequelize');
const sequelize = require('../db');

class GalaxyService {
	async getUserGalaxies(userId) {
		try {
			const galaxiesRaw = await Galaxy.findAll({
				where: { userId: userId },
				order: [['stars', 'DESC']],
			});

			if (!galaxiesRaw) return [];

			const galaxies = galaxiesRaw.map((item) => item.toJSON());

			await loggerService.logging(
				userId,
				'GET',
				`User id: ${userId} requested their galaxies`,
				0
			);

			return galaxies;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user galaxies: ${err.message}`
			);
		}
	}

	async getShowGalaxies(tmaId) {
		try {
			const user = await User.findOne({ where: { tmaId: tmaId } });
			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			// Get total count of available galaxies
			const count = await Galaxy.count({
				where: {
					userId: { [Op.ne]: user.id },
					//active: true, // Add an active flag if needed
				},
			});

			if (count === 0) {
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
				order: sequelize.random(), // Use true random ordering
				offset: offset,
				limit: itemsPerPage,
				include: [
					{
						model: User,
						attributes: ['tmaUsername'],
					},
				],
			});

			const galaxies = galaxiesRaw.map((item) => item.toJSON());

			await loggerService.logging(
				user.id,
				'GET',
				`User tmaId: ${tmaId} requested galaxies for sale`,
				0
			);

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
			throw ApiError.Internal(
				`Failed to get show galaxies: ${err.message}`
			);
		}
	}

	// one galaxy
	async getGalaxy(id) {
		try {
			const galaxy = await Galaxy.findByPk(id, {
				include: [
					{
						model: User,
						attributes: ['tmaUsername'],
					},
				],
			});

			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found');
			}

			return galaxy;
		} catch (err) {
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
					stars: galaxyData.stars || 100,
					galaxyData: galaxyData.galaxyData,
					owner: galaxyData.galaxyData.owner || 'USER',
					galaxySetting: galaxyData.galaxySetting,
					active: true,
				},
				{ transaction: t }
			);

			await loggerService.logging(
				userId,
				'CREATE',
				`Created new galaxy with id: ${galaxy.id}`,
				galaxy.stars
			);

			await t.commit();
			return galaxy;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to create galaxy: ${err.message}`);
		}
	}

	// save new param for galaxy
	async updateGalaxyStars(id, stars) {
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
			if (stars < 0) {
				throw ApiError.BadRequest('Stars cannot be negative');
			}

			galaxy.stars = stars;
			await galaxy.save({ transaction: t });

			await loggerService.logging(
				galaxy.userId,
				'UPDATE',
				`User tmaId:${user.tmaId} updated galaxy stars`,
				stars
			);

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
			galaxy.owner = 'USER';
			galaxy.userId = newUserId;
			await galaxy.save({ transaction: t });

			await loggerService.logging(
				oldUserId,
				'UPDATE',
				`Galaxy id:${galaxy.id} ownership transferred to tmaId:${newUser.tmaId}`,
				galaxy.stars
			);

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
							stars: galaxyData.stars || 100,
							galaxyData: galaxyData.galaxyData,
							owner: galaxyData.galaxyData.owner || 'USER',
							galaxySetting: galaxyData.galaxySetting,
							active: true,
						},
						{ transaction: t }
					)
				)
			);

			await loggerService.logging(
				userId,
				'CREATE',
				`Batch created ${createdGalaxies.length} galaxies`,
				0
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
