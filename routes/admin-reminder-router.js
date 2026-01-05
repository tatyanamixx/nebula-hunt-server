/**
 * Admin Reminder Router
 * Admin-only endpoints for managing reminders
 */
const Router = require("express").Router;
const router = new Router();
const multer = require("multer");
const adminReminderController = require("../controllers/admin-reminder-controller");
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

// Configure multer for file uploads (memory storage)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept only image files
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"), false);
		}
	},
});

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

/**
 * @swagger
 * /admin/reminders/send-custom:
 *   post:
 *     summary: Send custom notification to users
 *     tags: [Admin, Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Custom message text
 *               userIds:
 *                 type: string
 *                 description: JSON string of user IDs array (null = send to all users)
 *               showOpenGameButton:
 *                 type: boolean
 *                 description: Show "Open Game" button
 *               showCommunityButton:
 *                 type: boolean
 *                 description: Show "Community" button
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file to attach to the message
 *     responses:
 *       200:
 *         description: Custom notification sent successfully
 */
router.post(
	"/send-custom",
	adminAuthMiddleware,
	rateLimitMiddleware(20, 10), // 20 requests per 10 minutes
	upload.single("photo"), // Handle file upload
	adminReminderController.sendCustomNotification
);

module.exports = router;
