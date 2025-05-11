const ApiError = require('../exceptions/api-error');
const telegram = require('@telegram-apps/init-data-node');
const token = process.env.TG_BOT_API_KEY;
const userService = require('../service/user-service');

class UserController {
	async registration(req, res, next) {
		try {
			const tmaId = req.tmaInitdata.id;
			const tmaUsername = req.tmaInitdata.username;
			const { referral, userState, galaxies } = req.body;
			const userData = await userService.registration(
				tmaId,
				tmaUsername,
				referral,
				userState,
				galaxies
			);
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 7 * 24 * 60 * 60 * 1000,
				httpOnly: true,
				// seen: true,
			});
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async login(req, res, next) {
		try {
			const tgId = req.userToken.id;
			const userData = await userService.login(tgId);
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 7 * 24 * 60 * 60 * 1000,
				httpOnly: true,
				// seen: true,
			});
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}
	async logout(req, res, next) {
		try {
			const { refreshToken } = req.cookies;
			const token = await userService.logout(refreshToken);
			res.clearCookie('refreshToken');
			return res.json(token);
		} catch (err) {
			next(err);
		}
	}

	async refresh(req, res, next) {
		try {
			const { refreshToken } = req.cookies;
			const userData = await userService.refresh(refreshToken);
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 7 * 24 * 60 * 60 * 1000,
				httpOnly: true,
				// seen: true,
			});
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async getleaderboard(req, res, next) {
		try {
			const users = await userService.getLeaderBoard;
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new UserController();
