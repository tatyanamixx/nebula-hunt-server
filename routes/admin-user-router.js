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
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	adminUserController.getUsers
);

// Get user by ID
router.get(
	'/users/:userId',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	adminUserController.getUserById
);

// Get user statistics
router.get(
	'/users/stats',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	adminUserController.getUserStats
);

// Block user
router.post(
	'/users/:userId/block',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	adminUserController.blockUser
);

// Unblock user
router.post(
	'/users/:userId/unblock',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	adminUserController.unblockUser
);

// Toggle user block status
router.patch(
	'/users/:userId/block',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	adminUserController.toggleUserBlock
);

// Update user role
router.patch(
	'/users/:userId/role',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	adminUserController.updateUserRole
);

// Delete user
router.delete(
	'/users/:userId',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes,
	adminUserController.deleteUser
);

// Give currency to user
router.post(
	'/users/:userId/currency',
	adminAuthMiddleware,
	rateLimitMiddleware(100, 10), // 100 requests per 10 minutes,
	adminUserController.giveCurrency
);

// Get user details (galaxies, resources, leaderboard position)
router.get(
	'/users/:userId/details',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	adminUserController.getUserDetails
);

// Get user transactions
router.get(
	'/users/:userId/transactions',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	adminUserController.getUserTransactions
);

// Get all transactions
router.get(
	'/transactions',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	adminUserController.getAllTransactions
);

module.exports = router;
