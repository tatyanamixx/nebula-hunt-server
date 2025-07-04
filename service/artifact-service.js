const { Artifact } = require('../models/models');

class ArtifactService {
	/**
	 * Добавить артефакт пользователю
	 * @param {Object} params { userId, seed, name, description, rarity, image, effects, tradable }
	 */
	async addArtifactToUser({
		userId,
		seed,
		name,
		description,
		rarity,
		image,
		effects,
		tradable = true,
	}) {
		return await Artifact.create({
			userId,
			seed,
			name,
			description,
			rarity,
			image,
			effects,
			tradable,
		});
	}

	/**
	 * Получить все артефакты пользователя
	 * @param {number} userId
	 */
	async getUserArtifacts(userId) {
		return await Artifact.findAll({ where: { userId } });
	}
}

module.exports = new ArtifactService();
