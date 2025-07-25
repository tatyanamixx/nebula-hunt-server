/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminController = require('../controllers/admin-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Admin login
router.post(
	'/login',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	adminController.loginAdmin
);

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

// Initialize supervisor
router.post(
	'/supervisor/init',
	rateLimitMiddleware(1, 3600), // Ограничиваем до 1 запроса в час
	adminController.initSupervisor
);

module.exports = router;
