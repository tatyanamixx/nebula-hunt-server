/**
 * Собственный middleware для логирования HTTP запросов
 * Исключает логирование Swagger документации
 * Created by Claude on 15.07.2025
 */
const logger = require('../service/logger-service');

module.exports = function customLoggingMiddleware(req, res, next) {
	// Пропускаем логирование для Swagger документации
	if (req.url === '/api-docs' || req.url.startsWith('/api-docs/')) {
		return next();
	}

	const start = Date.now();

	// Логируем завершение запроса
	res.on('finish', () => {
		const duration = Date.now() - start;
		const logLevel = res.statusCode >= 400 ? 'error' : 'info';

		logger[logLevel](
			`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
			{
				method: req.method,
				url: req.url,
				statusCode: res.statusCode,
				duration,
				ip: req.ip,
				userAgent: req.get('User-Agent'),
			}
		);
	});

	// Логируем ошибки
	res.on('error', (err) => {
		logger.error(`Request error: ${req.method} ${req.url}`, {
			error: err.message,
			stack: err.stack,
			method: req.method,
			url: req.url,
			ip: req.ip,
		});
	});

	next();
};
