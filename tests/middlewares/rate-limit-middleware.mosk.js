const rateLimit = require('express-rate-limit');

/**
 * Rate limit middleware for tests: не использует id пользователя, только req.ip
 * @param {number} max - Maximum number of requests within windowMinutes
 * @param {number} windowMinutes - Time window in minutes
 * @returns {Function} Express middleware
 */
module.exports = function (max, windowMinutes) {
	return rateLimit({
		windowMs: windowMinutes * 60 * 1000,
		max: max,
		message: {
			status: 'error',
			message: 'Too many requests, please try again later.',
		},
		standardHeaders: true,
		legacyHeaders: false,
		keyGenerator: (req) => req.ip,
	});
};
