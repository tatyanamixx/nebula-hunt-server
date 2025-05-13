const ApiError = require('../exceptions/api-error');
const galaxyService = require('../service/galaxy-service');

class GalaxyController {
	async create(req, res) {}

	async getgalaxy(req, res, next) {
		try {
			const { id } = req.params;
			if (!id) {
				return next(ApiError.BadRequest('Param not defind Id'));
			}
			const galaxy = await galaxyService.getGalaxy(id);
			res.json(galaxy);
		} catch (err) {
			next(err);
		}
	}

	async getusergalaxies(req, res, next) {
		try {
			const { id } = req.params;
			if (!id) {
				return next(ApiError.BadRequest('Param not defind Id'));
			}
			const galaxies = await galaxyService.getUserGalaxies(id);
			res.json(galaxies);
		} catch (err) {
			next(err);
		}
	}

	async getshowgalaxies(req, res, next) {
		try {
			const { id } = req.params;
			if (!id) {
				return next(ApiError.BadRequest('Param not defind Id'));
			}
			const galaxies = await galaxyService.getShowGalaxies(id);
			res.json(galaxies);
		} catch (err) {
			next(err);
		}
	}

	async updategalaxystars(req, res, next) {
		try {
			const { id, stars } = req.params;
			const galaxy = await galaxyService.updateGalaxyStars(id, stars);
			res.json(galaxy);
		} catch (err) {
			next(err);
		}
	}

	async updateparams(req, res, next) {
		try {
			console.log('что-то пошло не так');
			let { galaxy } = req.body;
			galaxy = await galaxyService.updateGalaxyParams(galaxy);
			res.json(galaxy);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new GalaxyController();
