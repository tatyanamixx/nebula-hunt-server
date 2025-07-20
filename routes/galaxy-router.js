/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
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
	authMiddleware,
	rateLimitMiddleware(60, 60),
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
	authMiddleware,
	rateLimitMiddleware(60, 60),
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
	authMiddleware,
	rateLimitMiddleware(60, 60),
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
	authMiddleware,
	rateLimitMiddleware(10, 60),
	galaxyController.createGalaxyWithOffer
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
	authMiddleware,
	rateLimitMiddleware(30, 60),
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
	rateLimitMiddleware(10, 60),
	galaxyController.deleteUserGalaxy
);

module.exports = router;
