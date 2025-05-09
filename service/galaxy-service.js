const { User, Galaxy } = require('../models/models');

class UserGalaxyService {
	// list galaxis for user
	async getUserGalaxies(userId) {
		const galaxies = await Galaxy.findOne({ where: { userId: userId } });
		console.log(galaxies);
		return galaxies;
	}

	// one galaxy
	async getGalaxi(Id) {
		const galaxy = await Galaxy.findById(Id);
		return galaxy;
	}

	// create one galaxy
	async createGalaxy(userId, galaxy) {
		const galaxyNew = await Galaxy.create({
			userId: userId,
			starsMin: galaxy.starsMin,
			starsCurrent: galaxy.starsCurrent,
			starsMax: galaxy.starsMax,
			price: galaxy.price,
			owner: galaxy.owner,
			galaxySetting: galaxy.galaxySetting,
		});
		return galaxyNew;
	}

	// save new param for galaxy
	async saveGalaxy(galaxy) {
		const galaxyData = await Galaxy.findById(galaxy.Id);
		if (galaxyData) {
			galaxyData = galaxy;
			return galaxyData.save();
		}
		// not found--> save as VERSE (can't go to waste!)
		const verse = await User.findOne({ where: { role: 'VERSE' } });
		const galaxyNew = await Galaxy.create({
			userId: verse.Id,
			starsMin: galaxy.starsMin,
			starsCurrent: galaxy.starsCurrent,
			starsMax: galaxy.starsMax,
			price: galaxy.price,
			owner: galaxy.owner,
			galaxySetting: galaxy.galaxySetting,
		});
		return galaxyNew;
	}
}

module.exports = new UserGalaxyService();
