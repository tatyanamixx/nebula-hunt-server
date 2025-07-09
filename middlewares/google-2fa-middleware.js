/**
 * Middleware для проверки Google 2FA (TOTP)
 * created by AI, 2024
 */
const speakeasy = require('speakeasy');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

/**
 * Ожидает:
 *   - req.userToken.google2faSecret (секрет пользователя для 2FA)
 *   - код 2FA в req.headers['x-2fa-code'] или req.body.otp
 */
module.exports = function google2faMiddleware(req, res, next) {
	try {
		const secret = req.userToken && req.userToken.google2faSecret;
		if (!secret) {
			return next(
				ApiError.UnauthorizedError('2FA: secret not set for user')
			);
		}

		let otp = req.headers['x-2fa-code'];
		if (!otp && req.body && req.body.otp) {
			otp = req.body.otp;
		}
		if (!otp) {
			return next(ApiError.UnauthorizedError('2FA: code required'));
		}

		const verified = speakeasy.totp.verify({
			secret,
			encoding: 'base32',
			token: otp,
			window: 1, // допускаем +/- 30 сек
		});
		if (!verified) {
			logger.warn('2FA: invalid code', { userId: req.userToken.id });
			return next(ApiError.UnauthorizedError('2FA: invalid code'));
		}
		next();
	} catch (err) {
		logger.error('2FA middleware error:', err);
		return next(ApiError.UnauthorizedError('2FA: unexpected error'));
	}
};
