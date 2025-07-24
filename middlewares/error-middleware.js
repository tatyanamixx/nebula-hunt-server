/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

module.exports = function (err, req, res, next) {
	// Логируем ошибку с контекстом запроса
	logger.error(err.message, {
		url: req.originalUrl,
		method: req.method,
		headers: req.headers,
		body: req.body,
		status: err.status || 500,
		errors: err.errors,
		stack: err.stack,
	});

	if (err instanceof ApiError) {
		const errorResponse = {
			message: err.message,
			errors: err.errors,
		};

		// Добавляем код ошибки, если он есть
		if (err.errorCode) {
			errorResponse.errorCode = err.errorCode;
		}

		// Добавляем уровень серьезности, если он есть
		if (err.severity) {
			errorResponse.severity = err.severity;
		}

		return res.status(err.status).json(errorResponse);
	}

	// Для неизвестных ошибок возвращаем системный код
	return res.status(500).json({
		message: err.message,
		errorCode: 'SYS_002',
		severity: 'CRITICAL',
	});
};
