const ApiError = require('../exceptions/api-error');
const galaxyService = require('../service/galaxy-service');

class GalaxyController {
	async create(req, res) {}

	async update(req, res, next) {
		try {
			let { galaxy } = req.body;
			const galaxyNew = await galaxyService.saveGalaxy(galaxy);
			galaxy = galaxyNew;
			res.json(galaxy);
		} catch (err) {
			next(err);
		}
	}

	async getone(req, res, next) {
		try {
			const { id } = req.query;
			if (!id) {
				return next(ApiError.badReuest('Param not defind Id'));
			}
			const galaxy = await galaxyService.getGalaxy(id);
			res.json(galaxy);
		} catch (err) {
			next(err);
		}
	}

	async getuserlist(req, res, next) {
		try {
			const { id } = req.query;
			if (!id) {
				return next(ApiError.badReuest('Param not defind Id'));
			}
			const galaxies = await galaxyService.getUserGalaxies(id);
			res.json(galaxies);
		} catch (err) {
			next(err);
		}
	}
	async getshowlist(req, res, next) {
		try {
			const { id } = req.query;
			if (!id) {
				return next(ApiError.badReuest('Param not defind Id'));
			}
			const galaxies = await galaxyService.getShowGalaxies(id);
			res.json(galaxies);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new GalaxyController();
