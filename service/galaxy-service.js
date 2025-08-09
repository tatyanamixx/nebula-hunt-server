/**
 * created by Tatyana Mikhniukevich on 08.05.2025
 */
const { User, Galaxy } = require("../models/models");
const logger = require("./logger-service");
const ApiError = require("../exceptions/api-error");
const { Op } = require("sequelize");
const sequelize = require("../db");
const { GALAXY_BASE_PRICE } = require("../config/constants");
const marketService = require("./market-service");
const userStateService = require("./user-state-service");
const { SYSTEM_USER_ID } = require("../config/constants");
const { GALAXY_LIMIT_FOR_USER } = require("../config/constants");

class GalaxyService {
	async getUserGalaxies(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			const galaxiesRaw = await Galaxy.findAll({
				where: { userId },
				order: [["starCurrent", "DESC"]],
				transaction: t,
			});

			if (!galaxiesRaw) {
				if (shouldCommit) {
					await t.commit();
				}
				return [];
			}

			const galaxies = galaxiesRaw.map((item) => item.toJSON());

			if (shouldCommit) {
				await t.commit();
			}
			return galaxies;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to get user galaxies: ${err.message}`);
		}
	}

	async getShowGalaxies(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

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
				if (shouldCommit) {
					await t.commit();
				}
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
						attributes: ["username", "role", "id"],
					},
				],
				transaction: t,
			});

			const galaxies = galaxiesRaw.map((item) => item.toJSON());

			if (shouldCommit) {
				await t.commit();
			}
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
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to get show galaxies: ${err.message}`);
		}
	}

	// one galaxy
	async getUserGalaxy(userId, seed, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			const galaxy = await Galaxy.findOne({
				where: { userId, seed },
				include: [
					{
						model: User,
						attributes: ["username", "id"],
					},
				],
				transaction: t,
			});

			if (!galaxy) {
				if (shouldCommit) {
					await t.rollback();
				}
				throw ApiError.GalaxyNotFound();
			}

			if (shouldCommit) {
				await t.commit();
			}
			return galaxy.toJSON();
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to get galaxy: ${err.message}`);
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
				throw ApiError.GalaxyNotFound(
					"Galaxy not found or not owned by user"
				);
			}

			// Hard delete
			await galaxy.destroy({ transaction: t });

			await t.commit();
			return {
				success: true,
				message: "Galaxy deleted successfully",
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
}

module.exports = new GalaxyService();
