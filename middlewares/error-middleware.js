/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');
const { serializeBigInt } = require('../utils/serialization');

module.exports = function (err, req, res, next) {
	// Сериализуем body перед логированием, чтобы избежать проблем с BigInt
	const serializedBody = serializeBigInt(req.body || {});
	
	// Логируем ошибку с контекстом запроса
	logger.error(err.message, {
		url: req.originalUrl,
		method: req.method,
		headers: req.headers,
		body: serializedBody,
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

		// Сериализуем ответ перед отправкой
		return res.status(err.status).json(serializeBigInt(errorResponse));
	}

	// Для неизвестных ошибок возвращаем системный код
	const unknownErrorResponse = {
		message: err.message,
		errorCode: 'SYS_002',
		severity: 'CRITICAL',
	};
	
	// Сериализуем ответ перед отправкой
	return res.status(500).json(serializeBigInt(unknownErrorResponse));
};
