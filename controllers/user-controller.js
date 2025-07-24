/**
 * created by Tatyana Mikhniukevich on 01.06.2025
 */
const userService = require('../service/user-service');
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class UserController {
	async registration(req, res, next) {
		try {
			const id = req.initdata.id;
			const username = req.initdata.username;

			let { referral, galaxy } = req.body;
			if (typeof referral === 'string') {
				try {
					referral = BigInt(referral);
				} catch {
					return next(
						ApiError.withCode(
							400,
							'Referral must be a number, bigint, or numeric string',
							'VAL_002'
						)
					);
				}
			} else if (typeof referral === 'number') {
				// Оставляем как есть (Number)
			} else if (typeof referral === 'bigint') {
				// Оставляем как есть (BigInt)
			} else if (referral !== undefined && referral !== null) {
				return next(
					ApiError.withCode(
						400,
						'Referral must be a number, bigint, or numeric string',
						'VAL_002'
					)
				);
			}
			logger.debug('User registration', {
				userId: id,
				username,
				referral,
				galaxy,
			});
			const userData = await userService.registration(
				id,
				username,
				referral,
				galaxy
			);
			logger.debug('User registered', { userData });
			logger.debug('User registration response details', {
				hasUser: !!userData.user,
				hasUserState: !!userData.userState,
				hasUserGalaxy: !!userData.userGalaxy,
				createdGalaxy: userData.createdGalaxy,
				userGalaxyKeys: userData.userGalaxy
					? Object.keys(userData.userGalaxy)
					: null,
			});
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
			const id = req.initdata.id;
			const userData = await userService.login(id);
			logger.debug('User login', { userId: id });
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
			// Используем refresh token из middleware (уже валидирован)
			const refreshToken = req.refreshToken;
			const userData = await userService.refresh(refreshToken);

			// Устанавливаем новый refresh token в cookies
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // HTTPS только в production
				sameSite: 'strict', // Защита от CSRF
			});

			logger.debug('Token refresh successful', {
				userId: req.refreshTokenData?.id,
				ip: req.ip,
			});

			return res.json(userData);
		} catch (e) {
			logger.error('Token refresh failed', {
				userId: req.refreshTokenData?.id,
				ip: req.ip,
				error: e.message,
			});
			next(e);
		}
	}

	async getFriends(req, res, next) {
		try {
			const id = req.initdata.id;
			const friends = await userService.getFriends(id);
			return res.json(friends);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UserController();
