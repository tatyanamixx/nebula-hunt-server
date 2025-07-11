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
	authMiddleware,
	rateLimitMiddleware(60, 60),
	eventController.getUserEvents
);

// Get all active events for the user
router.get(
	'/active',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	eventController.getActiveEvents
);

// Check and trigger events for the user
router.post(
	'/check',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	eventController.checkAndTriggerEvents
);

// Get event settings for the user
router.get(
	'/settings',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	eventController.getUserEventSettings
);

// Update event settings for the user
router.put(
	'/settings',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	eventController.updateUserEventSettings
);

// Get event statistics for the user
router.get(
	'/stats',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	eventController.getUserEventStats
);

// Get a specific event for the user
router.get(
	'/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	eventController.getUserEvent
);

// Trigger a specific event for the user
router.post(
	'/trigger/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	eventController.triggerEvent
);

// Complete an event for the user
router.post(
	'/complete/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	eventController.completeEvent
);

// Cancel an event for the user
router.post(
	'/cancel/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	eventController.cancelEvent
);

module.exports = router;
