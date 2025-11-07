/**
 * created by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();
const taskTemplateController = require("../controllers/task-template-controller");
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

// Get all task templates
router.get(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	taskTemplateController.getTaskTemplates
);

// Get a specific task template
router.get(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	taskTemplateController.getTaskTemplateBySlug
);

// Create a new task template
router.post(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	taskTemplateController.createTaskTemplates
);

// Update a task template
router.put(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	taskTemplateController.updateTaskTemplate
);

// Delete a task template
router.delete(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes,
	taskTemplateController.deleteTaskTemplate
);

// Toggle a task template status
router.put(
	"/:slug/toggle",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	taskTemplateController.toggleTaskTemplateStatus
);

module.exports = router;
