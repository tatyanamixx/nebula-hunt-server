/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const eventController = require('../controllers/event-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all events for the user
router.get(
	'/',
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	authMiddleware,
	eventController.getAllUserEvents
);

// Get all active events for the user
router.get(
	'/active',
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	authMiddleware,
	eventController.getActiveUserEvents
);

// Check and trigger events for the user
router.post(
	'/check',
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	authMiddleware,
	eventController.checkAndTriggerEvents
);

// Get event settings for the user
router.get(
	'/settings',
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	authMiddleware,
	eventController.getUserEventSettings
);

// Update event settings for the user
router.put(
	'/settings',
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	authMiddleware,
	eventController.updateUserEventSettings
);

// Get event statistics for the user
router.get(
	'/stats',
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	authMiddleware,
	eventController.getUserEventStats
);

// Get a specific event for the user
router.get(
	'/:eventId',
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	authMiddleware,
	eventController.getUserEvent
);

// Trigger a specific event for the user
router.post(
	'/trigger/:eventId',
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	authMiddleware,
	eventController.triggerEvent
);

// Complete an event for the user
router.post(
	'/complete/:eventId',
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	authMiddleware,
	eventController.completeEvent
);

// Cancel an event for the user
router.post(
	'/cancel/:eventId',
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	authMiddleware,
	eventController.cancelEvent
);

module.exports = router;
