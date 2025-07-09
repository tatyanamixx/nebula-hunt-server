/**
 * created by Tatyana Mikhniukevich on 01.06.2025
 */
const Router = require('express').Router;
const router = new Router();
const eventController = require('../controllers/event-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: Event
 *   description: User events
 */

// Пользовательские роуты
/**
 * @swagger
 * /events/:
 *   get:
 *     summary: Get user events
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user events
 */
router.get(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	eventController.getUserEvents
);
/**
 * @swagger
 * /events/check:
 *   get:
 *     summary: Check events
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events checked
 */
router.get(
	'/check',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	eventController.checkEvents
);

module.exports = router;
