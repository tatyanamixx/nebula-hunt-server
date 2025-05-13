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
		const count = await Galaxy.count({
			where: { userId: { [Op.ne]: userId } },
		});
		const page = Math.ceil(count / 20);
		const pagerandom = Math.round(Math.random() * (page - 1));
		const offset = pagerandom * 20;

		const countmock = 2872110;
		const pagemock = Math.ceil(countmock / 20);
		const pagerandommock = Math.round(Math.random() * (pagemock - 1));
		const offsetrandommock = pagerandommock * 20 + 1;

		const galaxiesRaw = await Galaxy.findAll({
			where: { userId: { [Op.ne]: userId } },
			offset: offset,
			limit: 20,
		});
		if (!galaxiesRaw) return null;
		const galaxies = galaxiesRaw.map((item) => item.toJSON());
		return {
			info: {
				count: count,
				page: page,
				pagerandom,
				offset: offset,
				pagemock,
				pagerandommock,
				offsetrandommock,
			},
			galaxies,
		};
	}

	// one galaxy
	async getGalaxy(id) {
		const galaxy = await Galaxy.findByPk(id);
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
		const galaxy = await Galaxy.findByPk(id);
		if (galaxy) {
			galaxy.stars = stars;
			await galaxy.save();
			return galaxy;
		}
		return galaxy;
	}

	// save new param for galaxy
	async updateGalaxyOwner(galaxynew) {
		const galaxy = await Galaxy.findByPk(galaxynew.Id);
		if (galaxy) {
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
