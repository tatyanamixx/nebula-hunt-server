const userStateService = require('../service/state-service');
const ApiError = require('../exceptions/api-error');

class UserStateController {
	async getUserState(req, res, next) {
		try {
			const userId = req.user.id;
			const userState = await userStateService.getUserState(userId);
			return res.json(userState);
		} catch (e) {
			next(e);
		}
	}

	async updateUserState(req, res, next) {
		try {
			const userId = req.user.id;
			const userState = req.body;
			const updatedState = await userStateService.updateUserState(
				userId,
				userState
			);
			return res.json(updatedState);
		} catch (e) {
			next(e);
		}
	}

	async getLeaderboard(req, res, next) {
		try {
			const leaderboard = await userStateService.leaderboard();
			return res.json(leaderboard);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UserStateController();
