/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminController = require('../controllers/admin-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const adminAuthMiddleware = require('../middlewares/admin-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Google OAuth аутентификация для администраторов
router.post(
	'/oauth/google',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.googleOAuth
);
router.post(
	'/oauth/2fa/verify',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.oauth2FAVerify
);

// Admin login (email + 2FA) - устаревший метод
router.post('/login', rateLimitMiddleware(100, 60), adminController.loginAdmin); // DEBUG: увеличен с 10 до 100

// Admin login with password
router.post(
	'/login/password',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.loginWithPassword
);

// Admin password 2FA verification
router.post(
	'/login/password/2fa/verify',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.password2FAVerify
);

// Admin logout
router.post(
	'/logout',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.logoutAdmin
);

// Initialize admin
router.post(
	'/init',

	rateLimitMiddleware(50, 60), // DEBUG: увеличен с 5 до 50
	adminController.initAdmin
);

// Verify 2FA
router.post(
	'/2fa/verify',

	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.verify2FA
);

// Initialize supervisor (legacy)
router.post(
	'/supervisor/init',
	rateLimitMiddleware(10, 3600), // DEBUG: увеличен с 1 до 10
	adminController.initSupervisor
);

// Complete 2FA setup (for registration)
router.post(
	'/2fa/complete',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.complete2FA
);

// Setup 2FA for existing admin
router.post(
	'/2fa/setup',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.setup2FA
);

// Disable 2FA
router.post(
	'/2fa/disable',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // DEBUG: увеличен с 5 до 50
	adminController.disable2FA
);

// Get 2FA info (QR code and secret)
router.get(
	'/2fa/info',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.get2FAInfo
);

// Get current admin info
router.get(
	'/me',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60),
	adminController.getCurrentAdmin
);

// Get 2FA QR code for login (no auth required)
router.get(
	'/2fa/qr/:email',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.get2FAQRForLogin
);

// Admin registration via invite
router.post(
	'/register',
	rateLimitMiddleware(50, 60), // DEBUG: увеличен с 5 до 50
	adminController.registerAdmin
);

// Send admin invite
router.post(
	'/invite',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // DEBUG: увеличен с 5 до 50
	adminController.sendInvite
);

// Validate invite token
router.get(
	'/invite/validate',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.validateInvite
);

// Get all invites
router.get(
	'/invites',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.getInvites
);

// Get admin stats
router.get(
	'/stats',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.getStats
);

// Refresh admin JWT token
router.post(
	'/refresh',
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.refreshToken
);

// Password management routes
router.post(
	'/password/change',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // DEBUG: увеличен с 5 до 50
	adminController.changePassword
);

router.post(
	'/password/force-change',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // DEBUG: увеличен с 5 до 50
	adminController.forceChangePassword
);

router.get(
	'/password/info',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // DEBUG: увеличен с 10 до 100
	adminController.getPasswordInfo
);

module.exports = router;
