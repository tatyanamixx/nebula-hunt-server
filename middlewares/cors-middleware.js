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

	console.log(`\n🔵 ========== CORS MIDDLEWARE START ==========`);
	console.log(`📍 URL: ${req.method} ${req.url}`);
	console.log(`🌐 Origin: ${origin || "undefined"}`);
	console.log(`🔑 Auth: ${req.headers.authorization ? "YES" : "NO"}`);

	// Check if headers already set (prevent duplicate calls)
	const existingOrigin = res.getHeader("Access-Control-Allow-Origin");
	console.log(`🔍 Existing CORS: ${existingOrigin || "none"}`);

	if (existingOrigin) {
		console.log(`⚠️ SKIPPING: Headers already exist!`);
		console.log(`🔵 ========== CORS END (SKIP) ==========\n`);
		logger.warn(
			`CORS: Headers already set! Skipping duplicate call for ${req.url}`
		);
		return next();
	}

	console.log(`✅ No existing headers, proceeding...`);

	// Always set CORS headers (for allowed origins or requests without origin)
	if (!origin || allowedOrigins.indexOf(origin) !== -1) {
		// Set the EXACT origin that made the request (not multiple, not array)
		const allowedOrigin = origin || allowedOrigins[0];
		console.log(`🎯 Allowed origin will be: ${allowedOrigin}`);

		// Remove any existing CORS headers first to prevent duplicates
		console.log(`🗑️  Removing existing headers...`);
		res.removeHeader("Access-Control-Allow-Origin");
		res.removeHeader("Access-Control-Allow-Credentials");
		res.removeHeader("Access-Control-Allow-Methods");
		res.removeHeader("Access-Control-Allow-Headers");
		res.removeHeader("Access-Control-Expose-Headers");
		res.removeHeader("Access-Control-Max-Age");
		console.log(`✅ Removed all CORS headers`);

		// Set fresh CORS headers
		console.log(`📝 Setting fresh CORS headers...`);
		res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
		console.log(`   ✓ Origin: ${allowedOrigin}`);

		res.setHeader("Access-Control-Allow-Credentials", "true");
		console.log(`   ✓ Credentials: true`);

		res.setHeader(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, PATCH, DELETE, OPTIONS"
		);
		console.log(`   ✓ Methods set`);

		res.setHeader(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization, x-telegram-init-data"
		);
		console.log(`   ✓ Headers set`);

		res.setHeader(
			"Access-Control-Expose-Headers",
			"Content-Length, Content-Type"
		);
		console.log(`   ✓ Expose headers set`);

		res.setHeader("Access-Control-Max-Age", "86400");
		console.log(`   ✓ Max-Age set`);

		console.log(`✅ All CORS headers set successfully!`);

		// Intercept response to check final headers before sending
		const originalEnd = res.end;
		res.end = function (...args) {
			console.log(`\n📤 ========== RESPONSE SENDING ==========`);
			const finalOrigin = res.getHeader("Access-Control-Allow-Origin");
			const finalCreds = res.getHeader("Access-Control-Allow-Credentials");
			const finalMethods = res.getHeader("Access-Control-Allow-Methods");

			console.log(`🔍 Final CORS headers:`);
			console.log(`   Origin: ${finalOrigin}`);
			console.log(`   Credentials: ${finalCreds}`);
			console.log(`   Methods: ${finalMethods}`);

			if (
				Array.isArray(finalOrigin) ||
				(typeof finalOrigin === "string" && finalOrigin.includes(","))
			) {
				console.error(`\n❌❌❌ DUPLICATE DETECTED! ❌❌❌`);
				console.error(`Final Origin value: ${finalOrigin}`);
				console.error(`Type: ${typeof finalOrigin}`);
				console.error(`Is Array: ${Array.isArray(finalOrigin)}`);
			} else {
				console.log(`✅ No duplicates detected`);
			}
			console.log(`📤 ========== RESPONSE END ==========\n`);
			return originalEnd.apply(res, args);
		};

		// Handle preflight OPTIONS request
		if (req.method === "OPTIONS") {
			console.log(`⚡ OPTIONS request - responding immediately`);
			console.log(`🔵 ========== CORS END (OPTIONS) ==========\n`);
			return res.status(204).end();
		}

		console.log(`➡️  Calling next() - passing to route handlers...`);
		console.log(`🔵 ========== CORS MIDDLEWARE END ==========\n`);
		next();
	} else {
		// Block unauthorized origin
		console.log(`\n🚫 ========== BLOCKED! ==========`);
		console.log(`❌ Origin not in allowed list: ${origin}`);
		console.log(`📋 Allowed origins:`, allowedOrigins);
		console.log(`🚫 ========== BLOCKED END ==========\n`);
		logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
		return res.status(403).json({ error: "Origin not allowed" });
	}
};
