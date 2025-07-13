/**
 * Универсальный middleware для валидации Telegram WebApp Data
 * Поддерживает два формата:
 * 1. Заголовок x-telegram-init-data
 * 2. Заголовок authorization с префиксом tma
 */
const ApiError = require('../exceptions/api-error');
const { parse, validate } = require('@telegram-apps/init-data-node');
const logger = require('../service/logger-service');

// Используем переменную для токена бота
const botToken = process.env.BOT_TOKEN;

module.exports = function telegramAuthMiddleware(req, res, next) {
	try {
		let initData = null;

		// Проверяем заголовок x-telegram-init-data
		if (req.headers['x-telegram-init-data']) {
			initData = req.headers['x-telegram-init-data'];
			logger.debug('Using x-telegram-init-data header for auth');
		}
		// Проверяем заголовок authorization с префиксом tma
		else if (req.headers.authorization) {
			const splitAuthHeader = req.headers.authorization.split(' ');
			const index = splitAuthHeader.indexOf('tma');
			if (index >= 0) {
				initData = splitAuthHeader[index + 1];
				logger.debug(
					'Using authorization header with tma prefix for auth'
				);
			}
		}

		// Если не нашли initData ни в одном из заголовков
		if (!initData) {
			return next(
				ApiError.TMAuthorizedError(
					'Telegram auth: initData not found in headers'
				)
			);
		}

		// Валидируем данные
		try {
			validate(initData, botToken);
		} catch (err) {
			logger.error('Telegram validation error:', err);
			return next(
				ApiError.TMAuthorizedError('Telegram auth: invalid signature')
			);
		}

		// Парсим и сохраняем данные пользователя
		req.initdata = parse(initData).user;
		return next();
	} catch (err) {
		logger.error('Telegram auth middleware unexpected error:', err);
		return next(
			ApiError.TMAuthorizedError(
				'Telegram auth: unexpected error: ' +
					(err && err.message ? err.message : String(err))
			)
		);
	}
};
