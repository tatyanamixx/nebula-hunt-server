/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const galaxyController = require('../controllers/galaxy-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: Galaxy
 *   description: Galaxy management
 */

router.post(
	'/',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(10, 60)],
	galaxyController.createGalaxy
);

/**
 * @swagger
 * /galaxy/:
 *   post:
 *     summary: Create a galaxy
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Galaxy created
 */

router.get(
	'/',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	galaxyController.getGalaxies
);

/**
 * @swagger
 * /galaxy/:
 *   get:
 *     summary: Get galaxies
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of galaxies
 */

router.put(
	'/',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	galaxyController.updateGalaxy
);

/**
 * @swagger
 * /galaxy/:
 *   put:
 *     summary: Update a galaxy
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Galaxy updated
 */

// Создать галактику от SYSTEM с офертой и инвойсом
router.post(
	'/system-offer',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(5, 60)],
	galaxyController.createSystemGalaxyWithOffer
);

/**
 * @swagger
 * /galaxy/system-offer:
 *   post:
 *     summary: Create system galaxy with offer
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: System galaxy created with offer
 */

// Добавить звезды в галактику
router.post(
	'/add-stars',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	galaxyController.addStarsToGalaxy
);

/**
 * @swagger
 * /galaxy/add-stars:
 *   post:
 *     summary: Add stars to a galaxy
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
 *               galaxyId:
 *                 type: integer
 *                 description: ID of the galaxy
 *               amount:
 *                 type: integer
 *                 description: Amount of stars to add
 *     responses:
 *       200:
 *         description: Stars added to galaxy
 *       404:
 *         description: Galaxy not found or not owned by user
 */

module.exports = router;
