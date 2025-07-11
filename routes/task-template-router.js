/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const taskTemplateController = require('../controllers/task-template-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all task templates
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	taskTemplateController.getAllTaskTemplates
);

// Get a specific task template
router.get(
	'/:taskId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	taskTemplateController.getTaskTemplate
);

// Create a new task template
router.post(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	taskTemplateController.createTaskTemplate
);

// Update a task template
router.put(
	'/:taskId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	taskTemplateController.updateTaskTemplate
);

// Delete a task template
router.delete(
	'/:taskId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	taskTemplateController.deleteTaskTemplate
);

// Activate a task template
router.post(
	'/:taskId/activate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	taskTemplateController.activateTaskTemplate
);

// Deactivate a task template
router.post(
	'/:taskId/deactivate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	taskTemplateController.deactivateTaskTemplate
);

module.exports = router;
