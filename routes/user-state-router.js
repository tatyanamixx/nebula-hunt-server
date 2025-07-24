/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
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

/**
 * @swagger
 * /state:
 *   get:
 *     summary: Get user state
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User state
 */
router.get(
	'/',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60),
	authMiddleware,
	userStateController.getUserState
);

/**
 * @swagger
 * /state/resources:
 *   get:
 *     summary: Get user resources
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User resources
 */
router.get(
	'/resources',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60),
	authMiddleware,
	userStateController.getUserResources
);

/**
 * @swagger
 * /state/daily-bonus:
 *   post:
 *     summary: Claim daily bonus
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily bonus claimed
 */
router.post(
	'/daily-bonus',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	userStateController.claimDailyBonus
);

/**
 * @swagger
 * /state/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard
 */
router.get(
	'/leaderboard',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60),
	authMiddleware,
	userStateController.getLeaderboard
);

/**
 * @swagger
 * /state:
 *   put:
 *     summary: Update user state
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User state updated
 */
router.put(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	userStateController.updateUserState
);

/**
 * @swagger
 * /state/farming:
 *   post:
 *     summary: Farming
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farming
 */
router.post(
	'/farming',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	userStateController.farming
);
module.exports = router;
