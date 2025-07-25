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
	rateLimitMiddleware(60, 60),
	authMiddleware,
	taskController.getUserTasks
);

// Get all active tasks for the user
router.get(
	'/active',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60),
	authMiddleware,
	taskController.getActiveTasks
);

// Get all completed tasks for the user
router.get(
	'/completed',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60),
	authMiddleware,
	taskController.getCompletedTasks
);

// Get task statistics for the user
router.get(
	'/stats',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60),
	authMiddleware,
	taskController.getTaskStats
);

// Get a specific task for the user
router.get(
	'/:slug',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60),
	authMiddleware,
	taskController.getUserTask
);

// Complete a user task
router.post(
	'/:slug/complete',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	taskController.completeTask
);

router.post(
	'/initialize',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	taskController.initializeUserTasks
);

module.exports = router;
