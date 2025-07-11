/**
 * Request validation middleware
 * Created by Claude on 15.07.2025
 */
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

/**
 * Middleware to validate request body size and prevent payload attacks
 */
const validateRequestSize = (maxSize = 1 * 1024 * 1024) => {
	return (req, res, next) => {
		// Skip for GET and OPTIONS requests
		if (req.method === 'GET' || req.method === 'OPTIONS') {
			return next();
		}

		const contentLength = parseInt(
			req.headers['content-length'] || '0',
			10
		);

		if (contentLength > maxSize) {
			logger.warn(`Request body too large: ${contentLength} bytes`);
			return next(ApiError.BadRequest('Request body too large'));
		}

		next();
	};
};

/**
 * Middleware to validate request against express-validator rules
 */
const validateRequest = () => {
	return (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			logger.warn('Request validation failed', {
				errors: errors.array(),
			});
			return next(
				ApiError.BadRequest('Validation error', errors.array())
			);
		}
		next();
	};
};

/**
 * Middleware to sanitize request body by removing potentially dangerous keys
 */
const sanitizeRequestBody = (
	dangerousKeys = ['__proto__', 'constructor', 'prototype']
) => {
	return (req, res, next) => {
		// Skip for GET and OPTIONS requests
		if (req.method === 'GET' || req.method === 'OPTIONS' || !req.body) {
			return next();
		}

		// Function to recursively sanitize object
		const sanitize = (obj) => {
			if (!obj || typeof obj !== 'object') return;

			// Remove dangerous keys
			for (const key of dangerousKeys) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) {
					logger.warn(
						`Removed dangerous key from request body: ${key}`
					);
					delete obj[key];
				}
			}

			// Recursively sanitize nested objects
			for (const key in obj) {
				if (
					Object.prototype.hasOwnProperty.call(obj, key) &&
					typeof obj[key] === 'object'
				) {
					sanitize(obj[key]);
				}
			}
		};

		sanitize(req.body);
		next();
	};
};

module.exports = {
	validateRequestSize,
	validateRequest,
	sanitizeRequestBody,
};
