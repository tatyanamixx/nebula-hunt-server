const galaxyService = require('../service/galaxy-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

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
}

module.exports = new GalaxyController();
