const { User, Galaxy } = require('../models/models');
const loggerService = require('./logger-service');
const { Op } = require('sequelize');

class UserGalaxyService {
	// list galaxis for user
	async getUserGalaxies(tmaId) {
		const user = await User.findOne({ where: { tmaId: tmaId } });
		const galaxiesRaw = await Galaxy.findAll({
			where: { userId: user.id },
		});
		if (!galaxiesRaw) return null;
		const galaxies = galaxiesRaw.map((item) => item.toJSON());

		await loggerService.logging(
			user.id,
			'GET',
			`The user ${tmaId} requested a list of galaxies`,
			0
		);

		return galaxies;
	}
	async getUserGalaxiesByUserId(userId) {
		//const user = await User.findOne({ where: { user: tmaId } });
		const galaxiesRaw = await Galaxy.findAll({
			where: { userId: userId },
		});
		if (!galaxiesRaw) return null;
		const galaxies = galaxiesRaw.map((item) => item.toJSON());

		return galaxies;
	}
	async getShowGalaxies(tmaId) {
		const user = await User.findOne({ where: { tmaId: tmaId } });
		const count = await Galaxy.count({
			where: { userId: { [Op.ne]: user.id } },
		});
		const page = Math.ceil(count / 20);
		const pagerandom = Math.round(Math.random() * (page - 1));
		const offset = pagerandom * 20;

		const countmock = 101;
		const pagemock = Math.ceil(countmock / 20);
		const pagerandommock = Math.round(Math.random() * (pagemock - 1));
		const offsetrandommock = pagerandommock * 20 + 1;

		const galaxiesRaw = await Galaxy.findAll({
			where: { userId: { [Op.ne]: user.id } },
			offset: offset,
			limit: 20,
		});
		if (!galaxiesRaw) return null;
		const galaxies = galaxiesRaw.map((item) => item.toJSON());

		await loggerService.logging(
			user.id,
			'GET',
			`The user ${tmaId} requested a list of galaxies for sale`,
			0
		);
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
		const user = await User.findOne({ where: { id: galaxy.userId } });

		await loggerService.logging(
			galaxy.userId,
			'UPDATE',
			`The user ${user.tmaId} updated a stars of galaxies`,
			stars
		);
		if (galaxy) {
			galaxy.stars = stars;
			await galaxy.save();
			return galaxy;
		}
		return galaxy;
	}

	// save new param for galaxy
	async updateGalaxyOwner(id, userId) {
		const galaxy = await Galaxy.findByPk(id);
		const user = await User.findOne({ where: { id: userId } });
		await loggerService.logging(
			galaxy.userId,
			'UPDATE',
			`The galaxy ${galaxy.id} has changed its owner to ${user.tmaId} `,
			stars
		);
		if (galaxy) {
			galaxy.owner = 'USER';
			galaxy.userId = userId;
			await galaxy.save();
			return galaxy;
		}
		return galaxy;
	}
}

module.exports = new UserGalaxyService();
