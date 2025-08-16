/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();
const userStateController = require("../controllers/user-state-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const telegramAuthMiddleware = require("../middlewares/telegram-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

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
	"/",
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
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
	"/resources",
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	authMiddleware,
	userStateController.getUserResources
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
	"/leaderboard",
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
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
	"/",
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	authMiddleware,
	userStateController.updateUserState
);

/**
 * @swagger
 * /state/update-initial-resources:
 *   post:
 *     summary: Update initial resources for all users according to current game constants
 *     tags: [UserState]
 *     security:
 *       - bearerAuth: []
 *     description: Admin endpoint to update all users' initial resources when game constants change
 *     responses:
 *       200:
 *         description: Initial resources updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedCount:
 *                   type: number
 *                   description: Number of users updated
 *       403:
 *         description: Access denied - admin only
 */
router.post(
	"/update-initial-resources",
	telegramAuthMiddleware,
	rateLimitMiddleware(10, 3600), // 10 requests per hour
	authMiddleware,
	userStateController.updateInitialResourcesForAllUsers
);

module.exports = router;
