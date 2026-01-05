/**
 * Bot Secret Middleware
 * Validates that requests come from the bot using REMINDER_SECRET
 */
const ApiError = require("../exceptions/api-error");
const logger = require("../service/logger-service");

// Helper function to sanitize secret value
function sanitizeSecret(value) {
	if (!value) return "";
	return String(value)
		.trim()
		.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
		.replace(/[\r\n]/g, "");
}

module.exports = function botSecretMiddleware(req, res, next) {
	const secretRaw = req.headers["x-bot-secret"] || req.body?.secret;
	const secret = sanitizeSecret(secretRaw);
	const expectedSecretRaw = process.env.REMINDER_SECRET;
	const expectedSecret = sanitizeSecret(expectedSecretRaw);

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
