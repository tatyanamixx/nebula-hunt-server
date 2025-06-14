const Router = require('express');
const taskController = require('../controllers/task-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');

const router = new Router();

// Get user tasks
router.get('/', authMiddleware, taskController.getUserTasks);

// Update task progress
router.post(
	'/:taskId/progress',
	authMiddleware,
	taskController.updateTaskProgress
);

// Admin routes
router.post(
	'/admin/create',
	authMiddleware,
	adminMiddleware,
	taskController.createTask
);

router.put(
	'/admin/:taskId',
	authMiddleware,
	adminMiddleware,
	taskController.updateTask
);

module.exports = router;
