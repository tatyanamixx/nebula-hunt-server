const { User } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const galaxyService = require('./galaxy-service');
const userService = require('./user-service');
const sequelize = require('../db');

class AdminService {
	async createVerseGalaxies(galaxies) {
		const t = await sequelize.transaction();

		try {
			// Ensure VERSE user exists
			const verse = await userService.ensureVerseUser(t);
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
