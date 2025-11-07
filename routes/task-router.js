/**
 * created by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();
const taskController = require("../controllers/task-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const telegramAuthMiddleware = require("../middlewares/telegram-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

/**
 * @swagger
 * tags:
 *   name: Task
 *   description: User tasks management
 */

// Get all tasks for the user
router.get(
	"/",
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 60), // 300 requests per hour,
	authMiddleware,
	taskController.getUserTasks
);

// Complete a user task
router.post(
	"/:slug/complete",
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	authMiddleware,
	taskController.completeTask
);

module.exports = router;
