/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const taskTemplateController = require('../controllers/task-template-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all task templates
router.get(
	'/',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	taskTemplateController.getTaskTemplates
);

// Get a specific task template
router.get(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	taskTemplateController.getTaskTemplateBySlug
);

// Create a new task template
router.post(
	'/',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	taskTemplateController.createTaskTemplates
);

// Update a task template
router.put(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	taskTemplateController.updateTaskTemplate
);

// Delete a task template
router.delete(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	taskTemplateController.deleteTaskTemplate
);

// Toggle a task template status
router.put(
	'/:slug/toggle',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	taskTemplateController.toggleTaskTemplateStatus
);

module.exports = router;
