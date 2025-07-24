/**
 * Refresh Token Middleware
 * Created by Claude on 15.07.2025
 */
const ApiError = require('../exceptions/api-error');
const tokenService = require('../service/token-service');
const logger = require('../service/logger-service');

module.exports = async function refreshTokenMiddleware(req, res, next) {
	try {
		// Получаем refresh token из cookies
		const { refreshToken } = req.cookies;

		if (!refreshToken) {
			logger.warn(
				'Refresh token middleware: No refresh token in cookies',
				{
					ip: req.ip,
					userAgent: req.get('User-Agent'),
				}
			);
			return next(
				ApiError.UnauthorizedError('Refresh token required in cookies')
			);
		}

		// Валидируем refresh token
		try {
			const userData = tokenService.validateRefreshToken(refreshToken);

			// Проверяем структуру payload
			if (!userData || !userData.id) {
				logger.warn(
					'Refresh token middleware: Invalid token payload - missing user ID',
					{
						ip: req.ip,
						payload: userData,
					}
				);
				return next(
					ApiError.UnauthorizedError(
						'Invalid refresh token payload - missing user ID'
					)
				);
			}

			// Преобразуем id в число для проверки
			const userId = Number(userData.id);
			if (isNaN(userId) || userId <= 0) {
				logger.warn(
					'Refresh token middleware: Invalid token payload - user ID must be a positive number',
					{
						ip: req.ip,
						payload: userData,
						userId: userData.id,
					}
				);
				return next(
					ApiError.UnauthorizedError(
						'Invalid refresh token payload - user ID must be a positive number'
					)
				);
			}

			// Добавляем данные пользователя в request для использования в контроллере
			req.refreshTokenData = { ...userData, id: userId };
			req.refreshToken = refreshToken;

			logger.debug(
				'Refresh token middleware: Token validated successfully',
				{
					ip: req.ip,
					userId: userId,
				}
			);

			next();
		} catch (error) {
			logger.warn('Refresh token middleware: Token validation failed', {
				ip: req.ip,
				error: error.message,
				token: refreshToken.substring(0, 20) + '...',
			});

			if (error.name === 'TokenExpiredError') {
				return next(
					ApiError.TokenExpiredError('Refresh token expired')
				);
			}
			if (error.name === 'JsonWebTokenError') {
				return next(
					ApiError.UnauthorizedError('Invalid refresh token')
				);
			}

			return next(
				ApiError.UnauthorizedError('Refresh token validation failed')
			);
		}
	} catch (error) {
		logger.error('Refresh token middleware: Unexpected error', {
			ip: req.ip,
			error: error.message,
			stack: error.stack,
		});
		return next(ApiError.Internal('Refresh token middleware error'));
	}
};
