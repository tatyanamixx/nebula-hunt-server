/**
 * created by Claude on 15.07.2025
 */
const Router = require('express');
const router = new Router();
const eventTemplateController = require('../controllers/event-template-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all event templates
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	eventTemplateController.getAllEventTemplates
);

// Get a specific event template
router.get(
	'/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	eventTemplateController.getEventTemplate
);

// Create a new event template
router.post(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	eventTemplateController.createEventTemplate
);

// Update an event template
router.put(
	'/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	eventTemplateController.updateEventTemplate
);

// Delete an event template
router.delete(
	'/:eventId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	eventTemplateController.deleteEventTemplate
);

// Activate an event template
router.post(
	'/:eventId/activate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	eventTemplateController.activateEventTemplate
);

// Deactivate an event template
router.post(
	'/:eventId/deactivate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	eventTemplateController.deactivateEventTemplate
);

module.exports = router;
