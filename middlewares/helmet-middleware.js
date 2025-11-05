/**
 * Helmet middleware configuration for enhanced security
 * Created by Claude on 15.07.2025
 */
const helmet = require('helmet');
const logger = require('../service/logger-service');

// Create a custom Helmet middleware with enhanced security settings
const helmetMiddleware = helmet({
	// Content Security Policy
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'], // Allow CDN for Swagger UI
			styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'], // Allow CDN for Swagger UI
			imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'], // Allow data: for Swagger UI images
			connectSrc: ["'self'", 'https://api.nebulahunt.site', 'https://nebulahunt.site'], // Allow API subdomain
			fontSrc: ["'self'", 'cdn.jsdelivr.net'],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"],
			sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
		},
	},
	// Cross-Origin settings
	crossOriginEmbedderPolicy: { policy: 'require-corp' },
	crossOriginOpenerPolicy: { policy: 'same-origin' },
	crossOriginResourcePolicy: { policy: 'same-origin' },
	// DNS prefetching
	dnsPrefetchControl: { allow: false },
	// Prevent iframe embedding
	frameguard: { action: 'deny' },
	// Hide X-Powered-By header
	hidePoweredBy: true,
	// HTTP Strict Transport Security
	hsts: {
		maxAge: 15552000, // 180 days
		includeSubDomains: true,
		preload: true,
	},
	// IE No Open
	ieNoOpen: true,
	// No Sniff MIME types
	noSniff: true,
	// Origin isolation
	originAgentCluster: true,
	// Prevent loading from plugins
	permittedCrossDomainPolicies: { permittedPolicies: 'none' },
	// Referrer policy
	referrerPolicy: { policy: 'no-referrer' },
	// XSS Protection
	xssFilter: true,
});

// Middleware wrapper for logging
module.exports = function (req, res, next) {
	logger.debug('Applying Helmet security headers');
	return helmetMiddleware(req, res, next);
};
