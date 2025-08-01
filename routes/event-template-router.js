/**
 * created by Claude on 15.07.2025
 */
const Router = require('express');
const router = new Router();
const eventTemplateController = require('../controllers/event-template-controller');
const adminAuthMiddleware = require('../middlewares/admin-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all event templates
router.get(
	'/',
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60),
	eventTemplateController.getAllEventTemplates
);

// Get a specific event template
router.get(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60),
	eventTemplateController.getEventTemplate
);

// Create a new event template
router.post(
	'/',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	eventTemplateController.createEventTemplates
);

// Update an event template
router.put(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	eventTemplateController.updateEventTemplate
);

// Delete an event template
router.delete(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(10, 60),
	eventTemplateController.deleteEventTemplate
);

// Toggle an event template status
router.put(
	'/:slug/toggle',
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60),
	eventTemplateController.toggleEventTemplateStatus
);

module.exports = router;
