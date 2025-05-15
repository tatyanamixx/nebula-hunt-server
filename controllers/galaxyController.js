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
			const id = req.userToken.id;
			const galaxies = await galaxyService.getUserGalaxies(id);
			res.json(galaxies);
		} catch (err) {
			next(err);
		}
	}

	async getshowgalaxies(req, res, next) {
		try {
			const tmaId = req.tmaInitdata.id;
			const galaxies = await galaxyService.getShowGalaxies(tmaId);
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

	async updategalaxyowner(req, res, next) {
		try {
			const { id, userId } = req.params;
			const galaxy = await galaxyService.updateGalaxyOwner(id, userId);
			res.json(galaxy);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new GalaxyController();
