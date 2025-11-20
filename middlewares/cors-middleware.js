/**
 * Custom CORS middleware (without external package to avoid duplicate headers)
 * Created by Claude on 20.11.2025
 */
const logger = require("../service/logger-service");

// Get allowed origins from environment variables or use default
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || clientUrl)
	.split(",")
	.map((origin) => origin.trim());

console.log("🔍 CORS DEBUG:");
console.log("  CLIENT_URL:", process.env.CLIENT_URL);
console.log("  ALLOWED_ORIGINS:", process.env.ALLOWED_ORIGINS);
console.log("  Final allowedOrigins:", allowedOrigins);

// Custom CORS middleware
module.exports = function corsMiddleware(req, res, next) {
	const origin = req.headers.origin;

	// Check if headers already set (prevent duplicate calls)
	const existingOrigin = res.getHeader("Access-Control-Allow-Origin");
	if (existingOrigin) {
		console.log(`⚠️ CORS: Headers already exist: ${existingOrigin}`);
		logger.warn(
			`CORS: Headers already set! Skipping duplicate call for ${req.url}`
		);
		return next();
	}
	console.log(
		`✅ CORS: Setting headers for ${req.method} ${req.url} from ${origin}`
	);

	// Always set CORS headers (for allowed origins or requests without origin)
	if (!origin || allowedOrigins.indexOf(origin) !== -1) {
		// Set the EXACT origin that made the request (not multiple, not array)
		const allowedOrigin = origin || allowedOrigins[0];

		// Remove any existing CORS headers first to prevent duplicates
		res.removeHeader("Access-Control-Allow-Origin");
		res.removeHeader("Access-Control-Allow-Credentials");
		res.removeHeader("Access-Control-Allow-Methods");
		res.removeHeader("Access-Control-Allow-Headers");
		res.removeHeader("Access-Control-Expose-Headers");
		res.removeHeader("Access-Control-Max-Age");

		// Set fresh CORS headers
		res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, PATCH, DELETE, OPTIONS"
		);
		res.setHeader(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization, x-telegram-init-data"
		);
		res.setHeader(
			"Access-Control-Expose-Headers",
			"Content-Length, Content-Type"
		);
		res.setHeader("Access-Control-Max-Age", "86400");

		console.log(`✅ CORS: Headers set successfully for ${allowedOrigin}`);

		// Handle preflight OPTIONS request
		if (req.method === "OPTIONS") {
			return res.status(204).end();
		}

		next();
	} else {
		// Block unauthorized origin
		logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
		return res.status(403).json({ error: "Origin not allowed" });
	}
};
