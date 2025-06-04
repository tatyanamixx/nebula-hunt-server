const achievementService = require('../service/achievement-service');
const ApiError = require('../exceptions/api-error');

class AchievementController {
	async getUserAchievements(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const achievements = await achievementService.getUserAchievements(
				id
			);
			return res.json(achievements);
		} catch (e) {
			next(e);
		}
	}

	async updateAchievementProgress(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const { achievementId } = req.params;
			const { progress } = req.body;

			if (typeof progress !== 'number') {
				throw ApiError.BadRequest('Progress must be a number');
			}

			const achievement = await achievementService.updateProgress(
				id,
				achievementId,
				progress
			);
			return res.json(achievement);
		} catch (e) {
			next(e);
		}
	}

	async createAchievement(req, res, next) {
		try {
			const achievementData = req.body;
			const achievement = await achievementService.createAchievement(
				achievementData
			);
			return res.json(achievement);
		} catch (e) {
			next(e);
		}
	}

	async updateAchievement(req, res, next) {
		try {
			const { achievementId } = req.params;
			const achievementData = req.body;
			const achievement = await achievementService.updateAchievement(
				achievementId,
				achievementData
			);
			return res.json(achievement);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new AchievementController();
