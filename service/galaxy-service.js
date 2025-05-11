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
	async getGalaxy(Id) {
		const galaxy = await Galaxy.findById(Id);
		return galaxy;
	}

	// create one galaxy
	async createGalaxy(userId, galaxy) {
		const galaxyNew = await Galaxy.create({
			userId: userId,
			galaxyData: galaxy.galaxyData,
			owner: galaxy.galaxyData.owner,
			galaxySetting: galaxy.galaxySetting,
		});
		return galaxyNew;
	}

	// save new param for galaxy
	async saveGalaxy(galaxy) {
		const galaxyRaw = await Galaxy.findById(galaxy.Id);
		if (galaxyRaw) {
			galaxyRaw.galaxyData = galaxy.galaxyData;
			galaxyRaw.owner = galaxy.owner;
			galaxyRaw.userId = galaxy.userid;
			//galaxyRaw.galaxySetting = galaxy.galaxySetting;
			return galaxyRaw.save();
		}
		// not found--> save as VERSE (can't go to waste!)
		const verse = await User.findOne({ where: { role: 'VERSE' } });
		const galaxyNew = await Galaxy.create({
			galaxyData: galaxy.galaxyData,
			owner: galaxy.owner,
			userId: verse.userId,
			galaxySetting: galaxy.galaxySetting,
		});
		return galaxyNew.toJSON();
	}
}

module.exports = new UserGalaxyService();
