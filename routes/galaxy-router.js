/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const galaxyController = require('../controllers/galaxy-controller');
const gameController = require('../controllers/game-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

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
	'/galaxies',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour
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
	'/:seed',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour
	authMiddleware,
	galaxyController.getUserGalaxy
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
	'/show',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour
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
	'/create',
	telegramAuthMiddleware,
	rateLimitMiddleware(10, 60), // 10 requests per hour
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
	'/daily-bonus',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour
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
	'/transferstars',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour
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
	'/:seed',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60), // 10 requests per hour
	galaxyController.deleteUserGalaxy
);

module.exports = router;
