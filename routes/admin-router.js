/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();
const adminController = require("../controllers/admin-controller");
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

// Google OAuth аутентификация для администраторов
router.post(
	"/oauth/google",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.googleOAuth
);
router.post(
	"/oauth/2fa/verify",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.oauth2FAVerify
);

// Admin login (email + 2FA) - устаревший метод
router.post("/login", rateLimitMiddleware(100, 10), adminController.loginAdmin); // 100 requests per 10 minutes

// Admin login with password
router.post(
	"/login/password",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.loginWithPassword
);

// Admin password 2FA verification
router.post(
	"/login/password/2fa/verify",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.password2FAVerify
);

// Admin logout
router.post(
	"/logout",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.logoutAdmin
);

// Initialize admin
router.post(
	"/init",

	rateLimitMiddleware(250, 10), // 250 requests per 10 minutes
	adminController.initAdmin
);

// Verify 2FA
router.post(
	"/2fa/verify",

	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.verify2FA
);

// Initialize supervisor (legacy)
router.post(
	"/supervisor/init",
	rateLimitMiddleware(50, 600), // 50 requests per 10 hours (было 60 часов)
	adminController.initSupervisor
);

// Complete 2FA setup (for registration)
router.post(
	"/2fa/complete",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.complete2FA
);

// Setup 2FA for existing admin
router.post(
	"/2fa/setup",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.setup2FA
);

// Disable 2FA
router.post(
	"/2fa/disable",
	adminAuthMiddleware,
	rateLimitMiddleware(250, 10), // 250 requests per 10 minutes
	adminController.disable2FA
);

// Get 2FA info (QR code and secret)
router.get(
	"/2fa/info",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.get2FAInfo
);

// Get current admin info
router.get(
	"/me",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.getCurrentAdmin
);

// Get 2FA QR code for login (no auth required)
router.get(
	"/2fa/qr/:email",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.get2FAQRForLogin
);

// Admin registration via invite
router.post(
	"/register",
	rateLimitMiddleware(250, 10), // 250 requests per 10 minutes
	adminController.registerAdmin
);

// Send admin invite
router.post(
	"/invite",
	adminAuthMiddleware,
	rateLimitMiddleware(250, 10), // 250 requests per 10 minutes
	adminController.sendInvite
);

// Validate invite token
router.get(
	"/invite/validate",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.validateInvite
);

// Get all invites
router.get(
	"/invites",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.getInvites
);

// Get admin stats
router.get(
	"/stats",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.getStats
);

// Refresh admin JWT token
router.post(
	"/refresh",
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.refreshToken
);

// Password management routes
router.post(
	"/password/change",
	adminAuthMiddleware,
	rateLimitMiddleware(250, 10), // 250 requests per 10 minutes
	adminController.changePassword
);

router.post(
	"/password/force-change",
	adminAuthMiddleware,
	rateLimitMiddleware(250, 10), // 250 requests per 10 minutes
	adminController.forceChangePassword
);

router.get(
	"/password/info",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.getPasswordInfo
);

// Game Constants Management
router.get(
	"/game-constants",
	adminAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	adminController.getGameConstants
);

router.put(
	"/game-constants",
	adminAuthMiddleware,
	rateLimitMiddleware(250, 10), // 250 requests per 10 minutes
	adminController.updateGameConstants
);

// Test SMTP endpoint (для диагностики)
router.get(
	"/test-smtp",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes
	adminController.testSMTP
);

module.exports = router;
