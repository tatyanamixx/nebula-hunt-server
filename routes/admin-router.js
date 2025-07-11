/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminController = require('../controllers/admin-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const { restrictAdminByIP } = require('../middlewares/ip-security-middleware');

// Get all users
router.get(
	'/users',
	restrictAdminByIP,
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	adminController.getUsers
);

// Block user
router.post(
	'/users/:userId/block',
	restrictAdminByIP,
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	adminController.blockUser
);

// Unblock user
router.post(
	'/users/:userId/unblock',
	restrictAdminByIP,
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	adminController.unblockUser
);

// Admin login
router.post(
	'/login',
	restrictAdminByIP,
	telegramAuthMiddleware,
	rateLimitMiddleware(10, 60),
	adminController.loginAdmin
);

// Admin logout
router.post(
	'/logout',
	restrictAdminByIP,
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	adminController.logoutAdmin
);

// Initialize admin
router.post(
	'/init',
	restrictAdminByIP,
	rateLimitMiddleware(5, 60),
	adminController.initAdmin
);

// Verify 2FA
router.post(
	'/2fa/verify',
	restrictAdminByIP,
	telegramAuthMiddleware,
	rateLimitMiddleware(10, 60),
	adminController.verify2FA
);

module.exports = router;
