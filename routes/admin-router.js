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
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.googleOAuth
);
router.post(
	"/oauth/2fa/verify",
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.oauth2FAVerify
);

// Admin login (email + 2FA) - устаревший метод
router.post("/login", rateLimitMiddleware(100, 60), adminController.loginAdmin); // 100 requests per hour

// Admin login with password
router.post(
	"/login/password",
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.loginWithPassword
);

// Admin password 2FA verification
router.post(
	"/login/password/2fa/verify",
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.password2FAVerify
);

// Admin logout
router.post(
	"/logout",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.logoutAdmin
);

// Initialize admin
router.post(
	"/init",

	rateLimitMiddleware(50, 60), // 50 requests per hour
	adminController.initAdmin
);

// Verify 2FA
router.post(
	"/2fa/verify",

	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.verify2FA
);

// Initialize supervisor (legacy)
router.post(
	"/supervisor/init",
	rateLimitMiddleware(10, 3600), // 10 requests per 60 hours (2.5 days)
	adminController.initSupervisor
);

// Complete 2FA setup (for registration)
router.post(
	"/2fa/complete",
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.complete2FA
);

// Setup 2FA for existing admin
router.post(
	"/2fa/setup",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.setup2FA
);

// Disable 2FA
router.post(
	"/2fa/disable",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour
	adminController.disable2FA
);

// Get 2FA info (QR code and secret)
router.get(
	"/2fa/info",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.get2FAInfo
);

// Get current admin info
router.get(
	"/me",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.getCurrentAdmin
);

// Get 2FA QR code for login (no auth required)
router.get(
	"/2fa/qr/:email",
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.get2FAQRForLogin
);

// Admin registration via invite
router.post(
	"/register",
	rateLimitMiddleware(50, 60), // 50 requests per hour
	adminController.registerAdmin
);

// Send admin invite
router.post(
	"/invite",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour
	adminController.sendInvite
);

// Validate invite token
router.get(
	"/invite/validate",
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.validateInvite
);

// Get all invites
router.get(
	"/invites",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.getInvites
);

// Get admin stats
router.get(
	"/stats",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.getStats
);

// Refresh admin JWT token
router.post(
	"/refresh",
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.refreshToken
);

// Password management routes
router.post(
	"/password/change",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour
	adminController.changePassword
);

router.post(
	"/password/force-change",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour
	adminController.forceChangePassword
);

router.get(
	"/password/info",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.getPasswordInfo
);

// Game Constants Management
router.get(
	"/game-constants",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	adminController.getGameConstants
);

router.put(
	"/game-constants",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour
	adminController.updateGameConstants
);

// Test SMTP endpoint (для диагностики)
router.get(
	"/test-smtp",
	adminAuthMiddleware,
	rateLimitMiddleware(10, 60), // 10 requests per hour
	adminController.testSMTP
);

module.exports = router;
