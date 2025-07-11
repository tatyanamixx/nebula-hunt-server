/**
 * IP Security Middleware
 * Created by Claude on 15.07.2025
 */
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

// Get blacklisted IPs from environment variables
const blacklistedIPs = (process.env.BLACKLISTED_IPS || '')
	.split(',')
	.filter(Boolean);

// Get whitelisted IPs for admin routes from environment variables
const adminWhitelistedIPs = (process.env.ADMIN_WHITELISTED_IPS || '')
	.split(',')
	.filter(Boolean);

/**
 * Middleware to block requests from blacklisted IPs
 */
const blockBlacklistedIPs = (req, res, next) => {
	const clientIP = req.ip || req.connection.remoteAddress;

	if (blacklistedIPs.includes(clientIP)) {
		logger.warn(`Blocked request from blacklisted IP: ${clientIP}`);
		return next(ApiError.Forbidden('Access denied'));
	}

	next();
};

/**
 * Middleware to restrict admin routes to whitelisted IPs
 * Only applied to admin routes if ADMIN_IP_RESTRICTION is enabled
 */
const restrictAdminByIP = (req, res, next) => {
	// Skip if admin IP restriction is not enabled
	if (process.env.ADMIN_IP_RESTRICTION !== 'true') {
		return next();
	}

	const clientIP = req.ip || req.connection.remoteAddress;

	// If whitelist is empty, allow all IPs (fallback)
	if (adminWhitelistedIPs.length === 0) {
		logger.warn(
			'Admin IP restriction enabled but no whitelisted IPs configured'
		);
		return next();
	}

	if (!adminWhitelistedIPs.includes(clientIP)) {
		logger.warn(
			`Blocked admin access from non-whitelisted IP: ${clientIP}`
		);
		return next(ApiError.Forbidden('Admin access denied from this IP'));
	}

	logger.debug(`Admin access allowed from whitelisted IP: ${clientIP}`);
	next();
};

/**
 * Middleware to detect and log suspicious IP patterns
 */
const detectSuspiciousIP = (req, res, next) => {
	const clientIP = req.ip || req.connection.remoteAddress;

	// Check for localhost in production
	if (
		process.env.NODE_ENV === 'production' &&
		(clientIP === '127.0.0.1' || clientIP === '::1')
	) {
		logger.warn(`Suspicious localhost access in production: ${clientIP}`);
	}

	// Check for private IPs in public-facing routes
	const privateIPRegex =
		/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|::1)/;
	if (
		process.env.NODE_ENV === 'production' &&
		!req.path.startsWith('/api/admin') &&
		privateIPRegex.test(clientIP)
	) {
		logger.warn(
			`Suspicious private IP access to public route: ${clientIP} -> ${req.path}`
		);
	}

	next();
};

module.exports = {
	blockBlacklistedIPs,
	restrictAdminByIP,
	detectSuspiciousIP,
};
