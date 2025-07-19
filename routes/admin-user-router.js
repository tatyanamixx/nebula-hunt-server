/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminUserController = require('../controllers/admin-user-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all users
router.get(
	'/users',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	adminUserController.getUsers
);

// Block user
router.post(
	'/users/:userId/block',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	adminUserController.blockUser
);

// Unblock user
router.post(
	'/users/:userId/unblock',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	adminUserController.unblockUser
);

module.exports = router;
