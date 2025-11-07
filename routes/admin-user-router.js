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
	rateLimitMiddleware(300, 60), // 300 requests per hour,
	adminUserController.getUsers
);

// Get user by ID
router.get(
	'/users/:userId',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 60), // 300 requests per hour,
	adminUserController.getUserById
);

// Get user statistics
router.get(
	'/users/stats',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	adminUserController.getUserStats
);

// Block user
router.post(
	'/users/:userId/block',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	adminUserController.blockUser
);

// Unblock user
router.post(
	'/users/:userId/unblock',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	adminUserController.unblockUser
);

// Toggle user block status
router.patch(
	'/users/:userId/block',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	adminUserController.toggleUserBlock
);

// Update user role
router.patch(
	'/users/:userId/role',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	adminUserController.updateUserRole
);

// Delete user
router.delete(
	'/users/:userId',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour,
	adminUserController.deleteUser
);

module.exports = router;
