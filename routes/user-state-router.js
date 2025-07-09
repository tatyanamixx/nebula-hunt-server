/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const userStateController = require('../controllers/user-state-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: UserState
 *   description: User state management
 */
router.get(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
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
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
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
	[tmaMiddleware, rateLimitMiddleware(120, 60)],
	userStateController.getLeaderboard
);
/**
 * @swagger
 * /state/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [UserState]
 *     responses:
 *       200:
 *         description: Leaderboard
 */

module.exports = router;
