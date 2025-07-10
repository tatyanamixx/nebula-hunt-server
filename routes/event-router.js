/**
 * created by Tatyana Mikhniukevich on 26.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const eventController = require('../controllers/event-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');

/**
 * @swagger
 * tags:
 *   name: Event
 *   description: User events
 */

// Пользовательские маршруты
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	eventController.getUserEvents
);

/**
 * @swagger
 * /events/{eventId}:
 *   get:
 *     summary: Get specific user event by ID
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User event details
 */
router.get(
	'/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	eventController.getUserEvent
);

/**
 * @swagger
 * /events/trigger:
 *   post:
 *     summary: Trigger an event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event triggered successfully
 */
router.post(
	'/trigger',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	eventController.triggerEvent
);

/**
 * @swagger
 * /events/settings:
 *   get:
 *     summary: Get user event settings
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User event settings
 */
router.get(
	'/settings',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	eventController.getUserEventSettings
);

/**
 * @swagger
 * /events/settings:
 *   put:
 *     summary: Update user event settings
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabledTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               disabledEvents:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User event settings updated
 */
router.put(
	'/settings',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	eventController.updateUserEventSettings
);

/**
 * @swagger
 * /events/initialize:
 *   post:
 *     summary: Initialize user events
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User events initialized
 */
router.post(
	'/initialize',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	eventController.initializeUserEvents
);

/**
 * @swagger
 * /events/stats:
 *   get:
 *     summary: Get user event statistics
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User event statistics
 */
router.get(
	'/stats',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	eventController.getUserEventStats
);

module.exports = router;
