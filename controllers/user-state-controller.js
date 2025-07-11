/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const userStateService = require('../service/state-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

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

	async getUserResources(req, res, next) {
		try {
			const id = req.initdata.id;
			const resources = await userStateService.getUserResources(id);
			return res.json(resources);
		} catch (e) {
			next(e);
		}
	}

	async claimDailyBonus(req, res, next) {
		try {
			const id = req.initdata.id;
			const result = await userStateService.claimDailyBonus(id);
			logger.info('Daily bonus claimed', {
				userId: id,
				bonus: result.bonus,
			});
			return res.json(result);
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
			logger.info('User state updated', {
				userId: id,
				newState: userState,
			});
			return res.json(updatedState);
		} catch (e) {
			next(e);
		}
	}

	async getLeaderboard(req, res, next) {
		try {
			const id = req.initdata.id;
			const leaderboard = await userStateService.leaderboard(id);
			return res.json(leaderboard);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UserStateController();
