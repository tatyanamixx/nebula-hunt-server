/**
 * Referral Router
 */
const Router = require("express").Router;
const router = new Router();
const referralController = require("../controllers/referral-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const telegramAuthMiddleware = require("../middlewares/telegram-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

/**
 * @swagger
 * tags:
 *   name: Referral
 *   description: Referral system endpoints
 */

/**
 * @swagger
 * /referral/process:
 *   post:
 *     summary: Process referral rewards
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referrerId
 *             properties:
 *               referrerId:
 *                 type: string
 *                 description: ID of the user who invited
 *     responses:
 *       200:
 *         description: Referral processed successfully
 *       400:
 *         description: Invalid referral
 *       404:
 *         description: User not found
 */
router.post(
	"/process",
	telegramAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour
	authMiddleware,
	referralController.processReferral
);

/**
 * @swagger
 * /referral/list:
 *   get:
 *     summary: Get user's referrals
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's referrals
 */
router.get(
	"/list",
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 60), // 300 requests per hour
	authMiddleware,
	referralController.getUserReferrals
);

module.exports = router;

