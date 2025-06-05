const userStateService = require('../service/state-service');
const ApiError = require('../exceptions/api-error');

class UserStateController {
	async getUserState(req, res, next) {
		try {
			const id = req.initdata.id;
			const userState = await userStateService.getUserState(id);
			return res.json(userState);
		} catch (e) {
			next(e);
		}
	}

	async updateUserState(req, res, next) {
		try {
			const id = req.initdata.id;
			const userState = req.body;
			const updatedState = await userStateService.updateUserState(
				id,
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
