const { User, UserState, Galaxy } = require('../models/models');

class UserGalaxyService {
	async getUserGalaxy(userId) {
		const galaxies = await Galaxy.findAll({ where: { userId: userId } });
		return galaxies;
	}

	async createGalaxy(userId, galaxy) {
		const gal = await Galaxy.create({
			userId: userId,
			starsMin: galaxy.starsMin,
			starCurrent: galaxy.starCurrent,
			starMax: galaxy.starMax,
			price: galaxy.price,
			owner: galaxy.owner,
			galaxySetting: galaxy.galaxySetting,
		});
		return gal;
	}

	async setGalaxyParam(galaxyId, params) {}
}

module.exports = new UserGalaxyService()
