/**
 * Универсальный middleware для валидации Telegram WebApp Data
 * Поддерживает несколько форматов:
 * 1. Заголовок x-telegram-init-data (прямая строка)
 * 2. Заголовок authorization с префиксом tma (base64 encoded)
 * 3. Заголовок x-telegram-init-data-raw (base64 encoded)
 */
const ApiError = require('../exceptions/api-error');
const { parse, validate } = require('@telegram-apps/init-data-node');
const logger = require('../service/logger-service');

// Используем переменную для токена бота
const botToken = process.env.BOT_TOKEN;

/**
 * Декодирует initData из различных форматов
 * @param {string} rawData - сырые данные в любом формате
 * @returns {string|null} - декодированная строка initData или null
 */
function decodeInitData(rawData) {
	if (!rawData) return null;

	try {
		// Если это уже URL-encoded строка (прямой формат)
		if (rawData.includes('=') && rawData.includes('&')) {
			logger.debug('Detected direct URL-encoded format');
			return rawData;
		}

		// Если это base64 encoded строка
		if (rawData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
			logger.debug('Detected base64 encoded format');
			const decoded = Buffer.from(rawData, 'base64').toString('utf-8');
			logger.debug('Base64 decoded:', decoded);
			return decoded;
		}

		// Если это JSON строка (редкий случай)
		if (rawData.startsWith('{') || rawData.startsWith('[')) {
			logger.debug('Detected JSON format');
			return rawData;
		}

		logger.warn(
			'Unknown initData format:',
			rawData.substring(0, 50) + '...'
		);
		return null;
	} catch (error) {
		logger.error('Error decoding initData:', error);
		return null;
	}
}

module.exports = function telegramAuthMiddleware(req, res, next) {
	try {
		let initData = null;
		let source = 'unknown';

		// 1. Проверяем заголовок x-telegram-init-data (прямой формат)
		if (req.headers['x-telegram-init-data']) {
			initData = req.headers['x-telegram-init-data'];
			source = 'x-telegram-init-data';
			logger.debug('Found x-telegram-init-data header');
		}
		// 2. Проверяем заголовок x-telegram-init-data-raw (base64 encoded)
		else if (req.headers['x-telegram-init-data-raw']) {
			initData = decodeInitData(req.headers['x-telegram-init-data-raw']);
			source = 'x-telegram-init-data-raw';
			logger.debug('Found x-telegram-init-data-raw header');
		}
		// 3. Проверяем заголовок authorization с префиксом tma
		else if (req.headers.authorization) {
			const authHeader = req.headers.authorization;
			logger.debug(
				'Authorization header:',
				authHeader.substring(0, 50) + '...'
			);

			const splitAuthHeader = authHeader.split(' ');
			const tmaIndex = splitAuthHeader.indexOf('tma');

			if (tmaIndex >= 0 && splitAuthHeader[tmaIndex + 1]) {
				const encoded = splitAuthHeader[tmaIndex + 1];
				initData = decodeInitData(encoded);
				source = 'authorization-tma';
				logger.debug('Found tma token in authorization header');
			}
		}

		// Если не нашли initData ни в одном из заголовков
		if (!initData) {
			logger.warn('No valid initData found in headers', {
				headers: Object.keys(req.headers).filter(
					(h) =>
						h.toLowerCase().includes('telegram') ||
						h.toLowerCase().includes('authorization')
				),
			});
			return next(
				ApiError.TMAuthorizedError(
					'Telegram auth: initData not found in headers'
				)
			);
		}

		logger.debug(`Processing initData from ${source}`, {
			initDataLength: initData.length,
			initDataPreview: initData.substring(0, 100) + '...',
		});

		// Валидируем данные
		try {
			validate(initData, botToken);
			logger.debug('Telegram initData validation successful');
		} catch (err) {
			logger.error('Telegram validation error:', {
				error: err.message,
				source,
				initDataLength: initData.length,
			});
			return next(
				ApiError.TMAuthorizedError('Telegram auth: invalid signature')
			);
		}

		// Парсим и сохраняем данные пользователя
		try {
			const parsedData = parse(initData);
			req.initdata = parsedData.user;

			logger.debug('Telegram user data parsed successfully', {
				userId: parsedData.user?.id,
				username: parsedData.user?.username,
				source,
			});
			
			logger.debug('Telegram user data parsed successfully', {
				initData: req.initdata,
			});
		} catch (parseError) {
			logger.error('Error parsing Telegram initData:', parseError);
			return next(
				ApiError.TMAuthorizedError('Telegram auth: parsing error')
			);
		}

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
