const { User, Galaxy } = require('../models/models');
const { Op } = require('sequelize');

class UserGalaxyService {
	// list galaxis for user
	async getUserGalaxies(userId) {
		const galaxiesRaw = await Galaxy.findAll({ where: { userId: userId } });
		if (!galaxiesRaw) return null;
		const galaxies = galaxiesRaw.map((item) => item.toJSON());
		return galaxies;
	}
	async getShowGalaxies(userId) {
		const galaxiesRaw = await Galaxy.findAll({
			where: { userId: { [Op.ne]: userId } },
		});
		if (!galaxiesRaw) return null;
		const galaxies = galaxiesRaw.map((item) => item.toJSON());
		return galaxies;
	}

	// one galaxy
	async getGalaxy(id) {
		const galaxy = await Galaxy.findOne({ where: { id: id } });
		return galaxy;
	}

	// create one galaxy
	async createGalaxy(userId, galaxynew) {
		const galaxy = await Galaxy.create({
			userId: userId,
			stars: galaxynew.stars,
			galaxyData: galaxynew.galaxyData,
			owner: galaxynew.galaxyData.owner,
			galaxySetting: galaxynew.galaxySetting,
		});
		return galaxy;
	}

	// save new param for galaxy
	async updateGalaxyStars(id, stars) {
		const galaxy = await Galaxy.findById(id);
		if (galaxy) {
			galaxy.stars = stars;
			await galaxy.save();
			return galaxy;
		}
		return galaxy;
	}

	// save new param for galaxy
	async updateGalaxyParams(galaxynew) {
		const galaxy = await Galaxy.findById(galaxynew.Id);
		if (galaxyRaw) {
			galaxy.stars = galaxynew.stars;
			galaxy.owner = galaxynew.owner;
			galaxy.userId = galaxynew.userid;
			//galaxyRaw.galaxyData = galaxy.galaxyData;
			await galaxy.save();
			return galaxy;
		}
		return null;
	}
}

module.exports = new UserGalaxyService();
