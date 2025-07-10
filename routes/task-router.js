/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const Router = require('express').Router;
const router = new Router();
const taskController = require('../controllers/task-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');

/**
 * @swagger
 * tags:
 *   name: Task
 *   description: User tasks management
 */

// Пользовательские маршруты
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	taskController.getUserTasks
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get specific user task by ID
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User task details
 */
router.get(
	'/:taskId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	taskController.getUserTask
);

/**
 * @swagger
 * /tasks/complete:
 *   post:
 *     summary: Complete a task
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task completed successfully
 */
router.post(
	'/complete',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	taskController.completeTask
);

/**
 * @swagger
 * /tasks/progress:
 *   post:
 *     summary: Update task progress
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *               progress:
 *                 type: number
 *     responses:
 *       200:
 *         description: Task progress updated
 */
router.post(
	'/progress',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	taskController.updateTaskProgress
);

/**
 * @swagger
 * /tasks/progress/{taskId}:
 *   get:
 *     summary: Get task progress
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task progress details
 */
router.get(
	'/progress/:taskId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	taskController.getTaskProgress
);

/**
 * @swagger
 * /tasks/initialize:
 *   post:
 *     summary: Initialize user tasks
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User tasks initialized
 */
router.post(
	'/initialize',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	taskController.initializeUserTasks
);

/**
 * @swagger
 * /tasks/stats:
 *   get:
 *     summary: Get user task statistics
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User task statistics
 */
router.get(
	'/stats',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	taskController.getUserTaskStats
);

module.exports = router;
