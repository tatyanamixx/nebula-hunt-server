/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminUserController = require('../controllers/admin-user-controller');
const adminAuthMiddleware = require('../middlewares/admin-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all users
router.get(
	'/users',
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60),
	adminUserController.getUsers
);

// Block user
router.post(
	'/users/:userId/block',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	adminUserController.blockUser
);

// Unblock user
router.post(
	'/users/:userId/unblock',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	adminUserController.unblockUser
);

// Toggle user block status
router.patch(
	'/users/:userId/block',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	adminUserController.toggleUserBlock
);

module.exports = router;
