/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025 and 26.07.2025
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

// Get user by ID
router.get(
	'/users/:userId',
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60),
	adminUserController.getUserById
);

// Get user statistics
router.get(
	'/users/stats',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	adminUserController.getUserStats
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

// Update user role
router.patch(
	'/users/:userId/role',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	adminUserController.updateUserRole
);

// Delete user
router.delete(
	'/users/:userId',
	adminAuthMiddleware,
	rateLimitMiddleware(10, 60),
	adminUserController.deleteUser
);

module.exports = router;
