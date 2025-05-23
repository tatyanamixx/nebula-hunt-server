const rateLimit = require('express-rate-limit');
const ApiError = require('../exceptions/api-error');

// Базовый лимитер для всех запросов
const defaultLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 минут
	max: 100, // Максимум 100 запросов за 15 минут
	message: 'Too many requests from this IP, please try again later',
	handler: (req, res, next) => {
		next(ApiError.TooManyRequests('Rate limit exceeded'));
	},
});

// Строгий лимитер для аутентификации
const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 час
	max: 5, // Максимум 5 попыток входа за час
	message: 'Too many login attempts, please try again later',
	handler: (req, res, next) => {
		next(ApiError.TooManyRequests('Too many login attempts'));
	},
});

// Лимитер для админских действий
const adminLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 час
	max: 50, // Максимум 50 админских действий в час
	message: 'Admin action rate limit exceeded',
	handler: (req, res, next) => {
		next(ApiError.TooManyRequests('Admin action rate limit exceeded'));
	},
});

// Лимитер для обновления состояний
const updateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 минута
	max: 30, // Максимум 30 обновлений в минуту
	message: 'Update rate limit exceeded',
	handler: (req, res, next) => {
		next(ApiError.TooManyRequests('Update rate limit exceeded'));
	},
});

module.exports = {
	defaultLimiter,
	authLimiter,
	adminLimiter,
	updateLimiter,
};
