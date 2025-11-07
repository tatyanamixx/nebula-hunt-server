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
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	eventTemplateController.getAllEventTemplates
);

// Get a specific event template
router.get(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	eventTemplateController.getEventTemplate
);

// Create a new event template
router.post(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	eventTemplateController.createEventTemplates
);

// Update an event template
router.put(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	eventTemplateController.updateEventTemplate
);

// Delete an event template
router.delete(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes,
	eventTemplateController.deleteEventTemplate
);

// Toggle an event template status
router.put(
	"/:slug/toggle",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	eventTemplateController.toggleEventTemplateStatus
);

module.exports = router;
