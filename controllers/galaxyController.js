const ApiError = require('../exceptions/api-error');
const galaxyService = require('../service/galaxy-service');

class GalaxyController {
	async create(req, res) {}

	async updatestars(req, res, next) {
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

	async getone(req, res, next) {
		try {
			const { id } = req.params;
			if (!id) {
				return next(ApiError.badReuest('Param not defind Id'));
			}
			const galaxy = await galaxyService.getGalaxy(Number(id));
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
