/**
 * Additional security headers middleware
 * Created by Claude on 15.07.2025
 */
const logger = require('../service/logger-service');

module.exports = function securityHeadersMiddleware(req, res, next) {
	// Cache control
	res.setHeader(
		'Cache-Control',
		'no-store, no-cache, must-revalidate, proxy-revalidate'
	);
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	res.setHeader('Surrogate-Control', 'no-store');

	// Feature Policy / Permissions Policy
	res.setHeader(
		'Permissions-Policy',
		'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
	);

	// Clear Site Data (when logging out)
	if (req.path === '/api/auth/logout' || req.path === '/api/admin/logout') {
		res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
		logger.debug('Clear-Site-Data header set for logout path');
	}

	// Expect-CT header
	res.setHeader('Expect-CT', 'enforce, max-age=86400');

	logger.debug('Applied additional security headers');
	next();
};
