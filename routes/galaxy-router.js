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
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	galaxyController.getUserGalaxies
);

/**
 * @swagger
 * /galaxies/{galaxyId}:
 *   get:
 *     summary: Get specific galaxy by ID
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
 *         description: Galaxy details
 */
router.get(
	'/:galaxyId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	galaxyController.getGalaxy
);

/**
 * @swagger
 * /galaxies:
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
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	galaxyController.createUserGalaxy
);

/**
 * @swagger
 * /galaxies/{galaxyId}:
 *   put:
 *     summary: Update a galaxy
 *     tags: [Galaxy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: galaxyId
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
router.put(
	'/:galaxyId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	galaxyController.updateUserGalaxy
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
	'/:galaxyId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	galaxyController.deleteGalaxy
);

module.exports = router;
