/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminController = require('../controllers/admin-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Google OAuth аутентификация для администраторов
router.post(
	'/oauth/google',
	rateLimitMiddleware(10, 60),
	adminController.googleOAuth
);
router.post(
	'/oauth/2fa/verify',
	rateLimitMiddleware(10, 60),
	adminController.oauth2FAVerify
);

// Admin login (email + 2FA) - устаревший метод
router.post('/login', rateLimitMiddleware(10, 60), adminController.loginAdmin);

// Admin logout
router.post(
	'/logout',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	adminController.logoutAdmin
);

// Initialize admin
router.post(
	'/init',

	rateLimitMiddleware(5, 60),
	adminController.initAdmin
);

// Verify 2FA
router.post(
	'/2fa/verify',

	rateLimitMiddleware(10, 60),
	adminController.verify2FA
);

// Initialize supervisor (legacy)
router.post(
	'/supervisor/init',
	rateLimitMiddleware(1, 3600), // Ограничиваем до 1 запроса в час
	adminController.initSupervisor
);

// Complete 2FA setup (for registration)
router.post(
	'/2fa/complete',
	rateLimitMiddleware(10, 60),
	adminController.complete2FA
);

// Admin registration via invite
router.post(
	'/register',
	rateLimitMiddleware(5, 60),
	adminController.registerAdmin
);

// Send admin invite
router.post(
	'/invite',
	adminMiddleware,
	rateLimitMiddleware(5, 60),
	adminController.sendInvite
);

// Validate invite token
router.get(
	'/invite/validate',
	rateLimitMiddleware(10, 60),
	adminController.validateInvite
);

// Get all invites
router.get(
	'/invites',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	adminController.getInvites
);

// Get admin stats
router.get(
	'/stats',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	adminController.getStats
);

module.exports = router;
