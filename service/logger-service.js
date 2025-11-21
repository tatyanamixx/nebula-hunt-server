/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 */
const ApiError = require('../exceptions/api-error');
const pino = require('pino');
const config = require('../config/logger.config');
const { serializeBigInt } = require('../utils/serialization');

// Configure pino logger
const logger = pino(config);

class LoggerService {
	// Convenience methods for different log levels
	info(message, context = {}) {
		// Сериализуем контекст перед логированием, чтобы избежать проблем с BigInt
		const serializedContext = serializeBigInt(context);
		logger.info(serializedContext, message);
	}

	error(message, context = {}) {
		// Сериализуем контекст перед логированием, чтобы избежать проблем с BigInt
		const serializedContext = serializeBigInt(context);
		logger.error(serializedContext, message);
	}

	warn(message, context = {}) {
		// Сериализуем контекст перед логированием, чтобы избежать проблем с BigInt
		const serializedContext = serializeBigInt(context);
		logger.warn(serializedContext, message);
	}

	debug(message, context = {}) {
		// Сериализуем контекст перед логированием, чтобы избежать проблем с BigInt
		const serializedContext = serializeBigInt(context);
		logger.debug(serializedContext, message);
	}
}

module.exports = new LoggerService();
