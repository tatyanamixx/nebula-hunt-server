const galaxyService = require('../service/galaxy-service');
const ApiError = require('../exceptions/api-error');

class GalaxyController {
	async createGalaxy(req, res, next) {
		try {
			const userId = req.user.id;
			const galaxyData = req.body;
			const galaxy = await galaxyService.createGalaxy(userId, galaxyData);
			return res.json(galaxy);
		} catch (e) {
			next(e);
		}
	}

	async getGalaxies(req, res, next) {
		try {
			const userId = req.user.id;
			const galaxies = await galaxyService.getUserGalaxies(userId);
			return res.json(galaxies);
		} catch (e) {
			next(e);
		}
	}

	async updateGalaxy(req, res, next) {
		try {
			const userId = req.user.id;
			const { galaxyId } = req.params;
			const galaxyData = req.body;
			const galaxy = await galaxyService.updateGalaxy(
				userId,
				galaxyId,
				galaxyData
			);
			return res.json(galaxy);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new GalaxyController();
