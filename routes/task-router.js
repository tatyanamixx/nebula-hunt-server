/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const Router = require('express').Router;
const taskController = require('../controllers/task-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const { param } = require('express-validator');

const router = new Router();

/**
 * @swagger
 * tags:
 *   name: Task
 *   description: User tasks
 */

// Get user tasks
router.get(
	'/',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	taskController.getUserTasks
);

/**
 * @swagger
 * /tasks/:
 *   get:
 *     summary: Get user tasks
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user tasks
 */

// Update task progress
router.post(
	'/:taskId/progress',
	[
		tmaMiddleware,
		authMiddleware,
		rateLimitMiddleware(30, 60),
		param('taskId').isString().withMessage('taskId must be a string'),
	],
	taskController.updateTaskProgress
);

/**
 * @swagger
 * /tasks/{taskId}/progress:
 *   post:
 *     summary: Update task progress
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task progress updated
 */

module.exports = router;
