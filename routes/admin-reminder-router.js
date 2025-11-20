/**
 * Admin Reminder Router
 * Admin-only endpoints for managing reminders
 */
const Router = require("express").Router;
const router = new Router();
const adminReminderController = require("../controllers/admin-reminder-controller");
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

/**
 * @swagger
 * /admin/reminders/trigger:
 *   post:
 *     summary: Manually trigger reminder notifications
 *     tags: [Admin, Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminders triggered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
	"/trigger",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes
	adminReminderController.triggerReminders
);

/**
 * @swagger
 * /admin/reminders/stats:
 *   get:
 *     summary: Get reminder statistics
 *     tags: [Admin, Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder statistics
 */
router.get(
	"/stats",
	adminAuthMiddleware,
	rateLimitMiddleware(100, 10), // 100 requests per 10 minutes
	adminReminderController.getReminderStats
);

module.exports = router;
