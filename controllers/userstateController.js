const ApiError = require('../exceptions/api-error');
const telegram = require('@telegram-apps/init-data-node');
const userStateService = require('../service/state-service');

class UserStateController {
	async leaderboard(req, res, next) {
		try {
			const users = await userStateService.leaderboard();
			return res.json(users);
		} catch (err) {
			next(err);
		}
	}

	async updateuserstate(req, res, next) {
		try {
			const { userId, userState } = req.body;
			const userData = await userStateService.updateUserState(
				userId,
				userState
			);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new UserStateController();
