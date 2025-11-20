/**
 * Admin Reminder Router
 * Admin-only endpoints for managing reminders
 */
const Router = require("express").Router;
const router = new Router();
const adminReminderController = require("../controllers/admin-reminder-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const adminMiddleware = require("../middlewares/admin-middleware");

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
	authMiddleware,
	adminMiddleware,
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
	authMiddleware,
	adminMiddleware,
	adminReminderController.getReminderStats
);

module.exports = router;

