/**
 * Middleware для валидации Telegram WebApp Data через x-telegram-init-data
 * created by AI, 2024
 */
const ApiError = require('../exceptions/api-error');
const { parse, validate } = require('@telegram-apps/init-data-node');
const logger = require('../service/logger-service');

const botToken = process.env.BOT_TOKEN || process.env.TG_BOT_API_KEY;

module.exports = function validateTelegramWebAppData(req, res, next) {
	try {
		const initData = req.headers['x-telegram-init-data'];
		if (!initData) {
			return next(
				ApiError.TMAuthorizedError(
					'Telegram WebApp: x-telegram-init-data header required'
				)
			);
		}
		try {
			validate(initData, botToken);
		} catch (err) {
			logger.error('Telegram WebApp validation error:', err);
			return next(
				ApiError.TMAuthorizedError('Telegram WebApp: invalid signature')
			);
		}
		// Можно парсить user, если нужно только user-объект
		req.initdata = parse(initData).user;
		return next();
	} catch (err) {
		logger.error('Telegram WebApp middleware unexpected error:', err);
		return next(
			ApiError.TMAuthorizedError(
				'Telegram WebApp: unexpected error: ' +
					(err && err.message ? err.message : String(err))
			)
		);
	}
};
