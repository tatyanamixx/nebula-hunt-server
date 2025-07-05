/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const taskController = require('../controllers/task-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');

const router = new Router();

// Get user tasks
router.get(
	'/',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	taskController.getUserTasks
);

// Update task progress
router.post(
	'/:taskId/progress',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	taskController.updateTaskProgress
);

// Admin routes
router.post(
	'/admin/create',
	tmaMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	taskController.createTask
);

router.put(
	'/admin/:taskId',
	tmaMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	taskController.updateTask
);

module.exports = router;
