/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();
const galaxyController = require("../controllers/galaxy-controller");
const gameController = require("../controllers/game-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const telegramAuthMiddleware = require("../middlewares/telegram-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

/**
 * @swagger
 * tags:
 *   name: Galaxy
 *   description: Galaxy management
 */

/**
 * @swagger
 * /galaxies:
 *   get:
 *     summary: Get user galaxies
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user galaxies
 */
router.get(
	"/",
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes
	authMiddleware,
	galaxyController.getUserGalaxies
);

/**
 * @swagger
 * /galaxies/{seed}:
 *   get:
 *     summary: Get specific galaxy by ID
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seed
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Galaxy details
 */
router.get(
	"/:seed",
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes
	authMiddleware,
	galaxyController.getUserGalaxy
);

/**
 * @swagger
 * /galaxies/{seed}:
 *   patch:
 *     summary: Update a galaxy
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seed
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lastCollectTime:
 *                 type: number
 *                 description: Timestamp of last resource collection
 *     responses:
 *       200:
 *         description: Galaxy updated successfully
 */
router.patch(
	"/:seed",
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes
	authMiddleware,
	galaxyController.updateGalaxy
);

/**
 * @swagger
 * /galaxies/show:
 *   get:
 *     summary: Get show galaxies
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of show galaxies
 */
router.get(
	"/show",
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes
	authMiddleware,
	galaxyController.getShowGalaxies
);
/**
 * @swagger
 * /galaxies/create:
 *   post:
 *     summary: Create a new galaxy
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seed:
 *                 type: string
 *               particleCount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Galaxy created successfully
 */
router.post(
	"/create",
	telegramAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes
	authMiddleware,
	galaxyController.createGalaxyWithOffer
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
	"/daily-bonus",
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes
	authMiddleware,
	gameController.claimDailyReward
);

/**
 * @swagger
 * /galaxies/transferstars:
 *   put:
 *     summary: Update a galaxy
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seed
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Galaxy updated successfully
 */
router.post(
	"/transferstars",
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes
	authMiddleware,
	galaxyController.transferStarsToUserGalaxy
);

/**
 * @swagger
 * /galaxies/{galaxyId}:
 *   delete:
 *     summary: Delete a galaxy
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: galaxyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Galaxy deleted successfully
 */
router.delete(
	"/:seed",
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes
	galaxyController.deleteUserGalaxy
);

/**
 * @swagger
 * /galaxies/{seed}/upgrade:
 *   post:
 *     summary: Upgrade a galaxy (change name, type, color, background)
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seed
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               upgradeType:
 *                 type: string
 *                 enum: [name, type, color, background]
 *               upgradeValue:
 *                 type: string
 *     responses:
 *       200:
 *         description: Galaxy upgraded successfully
 */
router.post(
	"/:seed/upgrade",
	telegramAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes
	authMiddleware,
	galaxyController.upgradeGalaxy
);

module.exports = router;
