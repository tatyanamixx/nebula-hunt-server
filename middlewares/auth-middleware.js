/**
 * JWT Authentication Middleware
 * created by Tatyana Mikhniukevich on 07.05.2025
 * updated by Claude on 15.07.2025
 */
const jwt = require('jsonwebtoken');
const ApiError = require('../exceptions/api-error');
const tokenService = require('../service/token-service');
const { User } = require('../models/models');
const logger = require('../service/logger-service');

module.exports = async function authMiddleware(req, res, next) {
	try {
		// Проверяем наличие заголовка Authorization
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			logger.warn('JWT: Authorization header not found', {
				ip: req.ip,
				userAgent: req.get('User-Agent'),
			});
			return next(
				ApiError.UnauthorizedError('JWT: Authorization header required')
			);
		}

		// Парсим заголовок Authorization
		const splitAuthHeader = authorizationHeader.split(' ');
		const bearerIndex = splitAuthHeader.indexOf('Bearer');

		if (bearerIndex < 0) {
			logger.warn(
				'JWT: Bearer scheme not found in Authorization header',
				{
					ip: req.ip,
					header: authorizationHeader.substring(0, 50) + '...',
				}
			);
			return next(
				ApiError.UnauthorizedError('JWT: Bearer scheme required')
			);
		}

		const accessToken = splitAuthHeader[bearerIndex + 1];
		if (!accessToken) {
			logger.warn('JWT: Access token not found after Bearer', {
				ip: req.ip,
			});
			return next(
				ApiError.UnauthorizedError('JWT: Access token required')
			);
		}

		// Валидируем access token
		let userData;
		try {
			userData = tokenService.validateAccessToken(accessToken);
		} catch (error) {
			logger.warn('JWT: Token validation failed', {
				ip: req.ip,
				error: error.message,
			});

			if (error instanceof jwt.TokenExpiredError) {
				return next(ApiError.TokenExpiredError('JWT: Token expired'));
			}
			if (error instanceof jwt.JsonWebTokenError) {
				return next(ApiError.UnauthorizedError('JWT: Invalid token'));
			}

			return next(
				ApiError.UnauthorizedError('JWT: Token validation failed')
			);
		}

		if (!userData) {
			logger.warn('JWT: Token validation returned null', {
				ip: req.ip,
			});
			return next(ApiError.UnauthorizedError('JWT: Invalid token'));
		}

		// Проверяем структуру payload
		if (!userData.id) {
			logger.warn('JWT: Invalid token payload - missing user ID', {
				ip: req.ip,
				payload: userData,
			});
			return next(
				ApiError.UnauthorizedError(
					'JWT: Invalid token payload - missing user ID'
				)
			);
		}

		// Преобразуем id в число для проверки
		const userId = Number(userData.id);
		if (isNaN(userId) || userId <= 0) {
			logger.warn(
				'JWT: Invalid token payload - user ID must be a positive number',
				{
					ip: req.ip,
					payload: userData,
					userId: userData.id,
				}
			);
			return next(
				ApiError.UnauthorizedError(
					'JWT: Invalid token payload - user ID must be a positive number'
				)
			);
		}

		// Проверяем пользователя в базе данных
		try {
			const user = await User.findOne({ where: { id: userId } });

			if (!user) {
				logger.warn('JWT: User not found in database', {
					ip: req.ip,
					userId: userId,
				});
				return next(ApiError.UnauthorizedError('JWT: User not found'));
			}

			// Проверяем блокировку пользователя
			if (user.blocked) {
				logger.warn(
					'JWT: Blocked user attempted to access protected route',
					{
						ip: req.ip,
						userId: userId,
					}
				);
				return next(ApiError.Forbidden('JWT: Account is blocked'));
			}

			// Добавляем данные пользователя в request
			req.user = user;
			req.userToken = { ...userData, id: userId };

			logger.debug('JWT: Authentication successful', {
				ip: req.ip,
				userId: userId,
				username: user.username,
			});

			next();
		} catch (dbError) {
			logger.error('JWT: Database error during user lookup', {
				ip: req.ip,
				userId: userId,
				error: dbError.message,
			});
			return next(ApiError.Internal('JWT: Database error'));
		}
	} catch (error) {
		logger.error('JWT: Unexpected error in auth middleware', {
			ip: req.ip,
			error: error.message,
			stack: error.stack,
		});
		return next(ApiError.Internal('JWT: Authentication error'));
	}
};
