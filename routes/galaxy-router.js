/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const galaxyController = require('../controllers/galaxy-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: Galaxy
 *   description: Galaxy management
 */

router.post(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(10, 60)],
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
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
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
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
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
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(5, 60)],
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

module.exports = router;
