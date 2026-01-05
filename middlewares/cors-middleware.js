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

// Custom CORS middleware
module.exports = function corsMiddleware(req, res, next) {
	// Prevent double execution
	if (res._corsProcessed) {
		logger.warn(`CORS: Middleware called twice for ${req.method} ${req.url}`);
		return next();
	}
	res._corsProcessed = true;
	
	const origin = req.headers.origin;

	// Check if headers already set (prevent duplicate calls)
	const existingOrigin = res.getHeader("Access-Control-Allow-Origin");
	if (existingOrigin) {
		logger.warn(`CORS: Headers already set! Skipping duplicate call for ${req.url}`);
		return next();
	}

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

		// Intercept response to check for duplicates (only log errors)
		const originalEnd = res.end;
		let endCalled = false;
		
		res.end = function (...args) {
			if (endCalled) {
				logger.error(`CORS: res.end() called twice for ${req.method} ${req.url}`);
				return;
			}
			endCalled = true;
			
			const finalOrigin = res.getHeader("Access-Control-Allow-Origin");
			if (
				Array.isArray(finalOrigin) ||
				(typeof finalOrigin === "string" && finalOrigin.includes(","))
			) {
				logger.error(`CORS: Duplicate header detected! Origin: ${finalOrigin}, Type: ${typeof finalOrigin}, Is Array: ${Array.isArray(finalOrigin)}`);
			}
			
			return originalEnd.apply(res, args);
		};

		// Handle preflight OPTIONS request
		if (req.method === "OPTIONS") {
			return res.status(204).end();
		}

		next();
	} else {
		// Block unauthorized origin
		logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}, Allowed: ${allowedOrigins.join(", ")}`);
		return res.status(403).json({ error: "Origin not allowed" });
	}
};
