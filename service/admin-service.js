const { User } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const galaxyService = require('./galaxy-service');
const sequelize = require('../db');

class AdminService {
	async initializeDatabase() {
		const t = await sequelize.transaction();

		try {
			// Create VERSE user if it doesn't exist
			let verse = await User.findOne({
				where: { role: 'VERSE' },
				transaction: t,
			});

			if (!verse) {
				verse = await User.create(
					{
						tmaId: -1,
						tmaUsername: 'universe',
						role: 'VERSE',
					},
					{ transaction: t }
				);
			}

			await t.commit();
			return {
				success: true,
				message: 'Database initialized successfully',
				verse,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Database initialization failed: ${err.message}`
			);
		}
	}

	async createVerseGalaxies(galaxies) {
		const t = await sequelize.transaction();

		try {
			// Get VERSE user
			const verse = await User.findOne({
				where: { role: 'VERSE' },
				transaction: t,
			});

			if (!verse) {
				throw ApiError.Internal(
					'VERSE user not found. Please initialize the database first.'
				);
			}

			const createdGalaxies = [];

			// Create all galaxies for VERSE user
			if (Array.isArray(galaxies)) {
				for (const galaxy of galaxies) {
					try {
						// Force owner to be VERSE
						galaxy.galaxyData = galaxy.galaxyData || {};
						galaxy.galaxyData.owner = 'VERSE';

						const newGalaxy = await galaxyService.createGalaxy(
							verse.id,
							galaxy,
							t
						);
						createdGalaxies.push(newGalaxy);
					} catch (err) {
						console.error(
							`Failed to create galaxy: ${err.message}`
						);
						// Continue with other galaxies even if one fails
					}
				}
			}

			await t.commit();

			return {
				success: true,
				message: `Created ${createdGalaxies.length} VERSE galaxies`,
				galaxies: createdGalaxies,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to create VERSE galaxies: ${err.message}`
			);
		}
	}
}

module.exports = new AdminService();
