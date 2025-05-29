const userService = require('../service/user-service');
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');

class UserController {
	async registration(req, res, next) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return next(
					ApiError.BadRequest('Validation error', errors.array())
				);
			}
			const { tmaId, tmaUsername, referral, userState, galaxies } =
				req.body;
			const userData = await userService.registration(
				tmaId,
				tmaUsername,
				referral,
				userState,
				galaxies
			);
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (e) {
			next(e);
		}
	}

	async login(req, res, next) {
		try {
			const { tmaId } = req.body;
			const userData = await userService.login(tmaId);
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (e) {
			next(e);
		}
	}

	async logout(req, res, next) {
		try {
			const { refreshToken } = req.cookies;
			const token = await userService.logout(refreshToken);
			res.clearCookie('refreshToken');
			return res.json(token);
		} catch (e) {
			next(e);
		}
	}

	async refresh(req, res, next) {
		try {
			const { refreshToken } = req.cookies;
			const userData = await userService.refresh(refreshToken);
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(userData);
		} catch (e) {
			next(e);
		}
	}

	async getFriends(req, res, next) {
		try {
			const userId = req.user.id;
			const { tmaId } = req.params;
			const friends = await userService.getFriends(userId, tmaId);
			return res.json(friends);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UserController();
