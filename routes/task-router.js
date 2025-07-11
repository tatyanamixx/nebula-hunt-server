/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const taskController = require('../controllers/task-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: Task
 *   description: User tasks management
 */

// Get all tasks for the user
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	taskController.getUserTasks
);

// Get all active tasks for the user
router.get(
	'/active',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	taskController.getActiveTasks
);

// Get all completed tasks for the user
router.get(
	'/completed',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	taskController.getCompletedTasks
);

// Get task statistics for the user
router.get(
	'/stats',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	taskController.getTaskStats
);

// Get a specific task for the user
router.get(
	'/:taskId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	taskController.getUserTask
);

// Update progress for a user task
router.put(
	'/:taskId/progress',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	taskController.updateTaskProgress
);

// Complete a task for the user
router.post(
	'/:taskId/complete',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	taskController.completeTask
);

module.exports = router;
