/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const userStateController = require('../controllers/user-state-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: UserState
 *   description: User state management
 */
router.get(
	'/',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	userStateController.getUserState
);
/**
 * @swagger
 * /state/:
 *   get:
 *     summary: Get user state
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User state
 */
router.put(
	'/',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	userStateController.updateUserState
);
/**
 * @swagger
 * /state/:
 *   put:
 *     summary: Update user state
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User state updated
 */
router.get(
	'/leaderboard',
	[telegramAuthMiddleware, rateLimitMiddleware(120, 60)],
	userStateController.getLeaderboard
);
/**
 * @swagger
 * /state/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     description: Returns the top users based on LEADERBOARD_LIMIT (default 100) and the current user's position if not in top list
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard data with top users and current user's position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   description: Top users based on LEADERBOARD_LIMIT, with current user appended if not in top list
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                         description: User ID
 *                       state:
 *                         type: object
 *                         properties:
 *                           totalStars:
 *                             type: integer
 *                             description: Total stars earned by user
 *                       currentStreak:
 *                         type: integer
 *                         description: Current login streak
 *                       maxStreak:
 *                         type: integer
 *                         description: Maximum login streak achieved
 *                       User:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                             description: Username
 *                       rating:
 *                         type: integer
 *                         description: User's position in the leaderboard
 *                 userRating:
 *                   type: integer
 *                   description: Current user's position in the overall leaderboard
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

module.exports = router;
