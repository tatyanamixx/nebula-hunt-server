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
		return res
			.status(err.status)
			.json({ message: err.message, errors: err.errors });
	}
	return res.status(500).json({ message: err.message });
};
