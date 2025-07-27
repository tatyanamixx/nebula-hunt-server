/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const rateLimit = require('express-rate-limit');

/**
 * Creates a rate limiter middleware
 * @param {number} max - Maximum number of requests within windowMinutes
 * @param {number} windowMinutes - Time window in minutes
 * @returns {Function} Express middleware
 */
module.exports = function (max, windowMinutes) {
	// DEBUG: Temporarily disable rate limiting for debugging
	if (process.env.DISABLE_RATE_LIMIT === 'true') {
		return (req, res, next) => {
			console.log('🔓 Rate limiting disabled for debugging');
			next();
		};
	}

	return rateLimit({
		windowMs: windowMinutes * 60 * 1000, // Convert minutes to milliseconds
		max: max, // Limit each IP to max requests per windowMs
		message: {
			status: 'error',
			message: 'Too many requests, please try again later.',
		},
		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
		// The id from the request will be used as the key
		keyGenerator: (req) => {
			// For Telegram auth routes, use initdata.id
			if (req.initdata && req.initdata.id) {
				return req.initdata.id;
			}
			// For other routes (like password login), use IP address
			return req.ip;
		},
	});
};
