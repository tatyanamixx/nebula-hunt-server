const ApiError = require('../exceptions/api-error');
const pino = require('pino');
const config = require('../config/logger.config');

// Configure pino logger
const logger = pino(config);

class LoggerService {
	// Convenience methods for different log levels
	info(message, context = {}) {
		logger.info(context, message);
	}

	error(message, context = {}) {
		logger.error(context, message);
	}

	warn(message, context = {}) {
		logger.warn(context, message);
	}

	debug(message, context = {}) {
		logger.debug(context, message);
	}
}

module.exports = new LoggerService();
