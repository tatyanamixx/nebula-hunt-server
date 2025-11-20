/**
 * Enhanced CORS middleware with better security
 * Created by Claude on 15.07.2025
 */
const cors = require("cors");
const logger = require("../service/logger-service");

// Get allowed origins from environment variables or use default
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || clientUrl).split(",");

console.log("🔍 CORS DEBUG:");
console.log("  CLIENT_URL:", process.env.CLIENT_URL);
console.log("  ALLOWED_ORIGINS:", process.env.ALLOWED_ORIGINS);
console.log("  Final allowedOrigins:", allowedOrigins);

// Create enhanced CORS configuration
const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps, curl, etc)
		if (!origin) {
			logger.debug("CORS: Request with no origin");
			return callback(null, true);
		}

		// Check if origin is in allowed list
		if (allowedOrigins.indexOf(origin) !== -1) {
			logger.debug(`CORS: Allowed origin: ${origin}`);
			return callback(null, true);
		}

		// Origin not allowed
		logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
		return callback(new Error("CORS: Origin not allowed"), false);
	},
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "x-telegram-init-data"],
	exposedHeaders: ["Content-Length", "Content-Type"],
	credentials: true,
	maxAge: 86400, // 24 hours
	preflightContinue: false,
	optionsSuccessStatus: 204,
};

// Export the middleware directly (without wrapper to avoid duplicate headers)
module.exports = cors(corsOptions);
