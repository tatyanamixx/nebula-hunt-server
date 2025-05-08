const ApiError = require('../exceprtions/api-error');
const telegram = require('@telegram-apps/init-data-node');
const token = process.env.TG_BOT_API_KEY;
const userService = require('../service/user-service');

class UserController {
	async registration(req, res, next) {
		try {
			const tgId = req.user.id;
			const tgUserName = req.user.username;
			const { galaxies } = req.body;
			const userData = await userService.registration(
				tgId,
				tgUserName,
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
			const tgId = initData.user.id;
			const tgUserName = initData.user.username;
			const userData = await userService.login(tgId, tgUserName);
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

	async getLeaderBoard(req, res, next) {
		try {
			const users = await userService.getLeaderBoard;
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new UserController();
