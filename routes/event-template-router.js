/**
 * created by Claude on 15.07.2025
 */
const Router = require("express");
const router = new Router();
const eventTemplateController = require("../controllers/event-template-controller");
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

// Get all event templates
router.get(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	eventTemplateController.getAllEventTemplates
);

// Get a specific event template
router.get(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	eventTemplateController.getEventTemplate
);

// Create a new event template
router.post(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
	eventTemplateController.createEventTemplates
);

// Update an event template
router.put(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
	eventTemplateController.updateEventTemplate
);

// Delete an event template
router.delete(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(10, 60), // 10 requests per hour,
	eventTemplateController.deleteEventTemplate
);

// Toggle an event template status
router.put(
	"/:slug/toggle",
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
	eventTemplateController.toggleEventTemplateStatus
);

module.exports = router;
