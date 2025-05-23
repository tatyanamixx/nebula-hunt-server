const ApiError = require('../exceptions/api-error');
const telegram = require('@telegram-apps/init-data-node');

const userAchievementService = require('../service/achievement-service');

class AchievementController {
	async createachievements(req, res, next) {
		try {
			const { achievement } = req.body;
			const userData = await userAchievementService.createAchievements(
				achievement
			);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}
	async activateuserachivements(req, res, next) {
		try {
			//const userId = req.userToken.id;
			const { userId } = req.userToken.id;
			const userData =
				await userAchievementService.activateUserAchievements(userId);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async getuserachievements(req, res, next) {
		try {
			//const userId = req.userToken.id;
			const { userId } = req.userToken.id;
			const userData = await userAchievementService.getUserAchievements(
				userId
			);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async updateUserAchievementByValue(req, res, next) {
		try {
			const { userId } = req.req.userToken.id;
			const { keyWord, value } = req.body;
			const userData =
				await userAchievementService.updateUserAchievementByValue(
					userId,
					keyWord,
					value
				);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

}

module.exports = new AchievementController();
