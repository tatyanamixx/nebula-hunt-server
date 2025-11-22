/**
 * Reminder Router
 * Handles daily reminder notifications
 */
const Router = require("express").Router;
const router = new Router();
const reminderController = require("../controllers/reminder-controller");
const botSecretMiddleware = require("../middlewares/bot-secret-middleware");

/**
 * @swagger
 * /users/inactive:
 *   get:
 *     summary: Get list of inactive users who need reminders
 *     tags: [Reminders]
 *     responses:
 *       200:
 *         description: List of inactive users
 */
router.get("/inactive", botSecretMiddleware, reminderController.getInactiveUsers);

/**
 * @swagger
 * /users/all-for-reminders:
 *   get:
 *     summary: Get all users with reminders enabled (for force sending)
 *     tags: [Reminders]
 *     responses:
 *       200:
 *         description: List of all users with reminders enabled
 */
router.get(
	"/all-for-reminders",
	botSecretMiddleware,
	reminderController.getAllUsersForReminders
);

/**
 * @swagger
 * /users/update-reminder-time:
 *   post:
 *     summary: Update last reminder sent timestamp
 *     tags: [Reminders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Timestamp updated successfully
 */
router.post(
	"/update-reminder-time",
	botSecretMiddleware,
	reminderController.updateReminderTime
);

module.exports = router;
