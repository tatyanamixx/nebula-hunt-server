/**
 * Bot Secret Middleware
 * Validates that requests come from the bot using REMINDER_SECRET
 */
const ApiError = require("../exceptions/api-error");
const logger = require("../service/logger-service");

module.exports = function botSecretMiddleware(req, res, next) {
	const secret = req.headers["x-bot-secret"] || req.body?.secret;
	const expectedSecret = process.env.REMINDER_SECRET;

	if (!expectedSecret) {
		logger.error("REMINDER_SECRET not configured in environment");
		return next(
			ApiError.withCode(
				500,
				"Server configuration error",
				"INTERNAL_SERVER_ERROR"
			)
		);
	}

	if (!secret || secret !== expectedSecret) {
		logger.warn("Bot secret validation failed", {
			ip: req.ip,
			url: req.url,
			hasSecret: !!secret,
		});
		return next(
			ApiError.withCode(
				401,
				"Unauthorized: Invalid bot secret",
				"UNAUTHORIZED"
			)
		);
	}

	logger.debug("Bot secret validated successfully", {
		ip: req.ip,
		url: req.url,
	});

	next();
};
