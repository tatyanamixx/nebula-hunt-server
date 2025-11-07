/**
 * created by Tatyana Mikhniukevich on 01.06.2025
 */
const Router = require("express").Router;
const router = new Router();
const userController = require("../controllers/user-controller");
const { body } = require("express-validator");
const telegramAuthMiddleware = require("../middlewares/telegram-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");
const authMiddleware = require("../middlewares/auth-middleware");
const refreshTokenMiddleware = require("../middlewares/refresh-token-middleware");
const { ERROR_CODES } = require("../config/error-codes");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and session management
 */

router.post(
	"/login",
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes
	userController.login
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Universal login/registration endpoint
 *     tags: [Auth]
 *     description: Automatically handles both login for existing users and registration for new users
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referral:
 *                 type: string
 *                 description: Referral code (number, bigint, or numeric string) - optional, used for new user registration
 *               galaxy:
 *                 type: object
 *                 description: Galaxy data - optional, used for new user registration
 *     responses:
 *       200:
 *         description: User logged in successfully (existing user)
 *       201:
 *         description: User registered and logged in successfully (new user)
 *       400:
 *         description: Bad request - invalid referral format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Referral must be a number, bigint, or numeric string"
 *                 errorCode:
 *                   type: string
 *                   example: "VAL_002"
 *       404:
 *         description: User not found (when no registration data provided)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *                 errorCode:
 *                   type: string
 *                   example: "AUTH_001"
 */

router.get(
	"/refresh",
	telegramAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	refreshTokenMiddleware,
	userController.refresh
);

/**
 * @swagger
 * /auth/refresh:
 *   get:
 *     summary: Refresh user session
 *     tags: [Auth]
 *     description: Refresh access token using refresh token from cookies. Requires Telegram WebApp initData in Authorization header with 'tma' prefix.
 *     responses:
 *       200:
 *         description: Session refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New access token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *                 user:
 *                   type: object
 *                   description: User data
 *       401:
 *         description: Invalid or expired refresh token, or invalid Telegram initData
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid refresh token"
 *                 errorCode:
 *                   type: string
 *                   example: "AUTH_003"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Rate limit exceeded"
 *                 errorCode:
 *                   type: string
 *                   example: "SYS_004"
 */

router.get(
	"/friends",
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes
	authMiddleware,
	userController.getFriends
);

/**
 * @swagger
 * /auth/friends:
 *   get:
 *     summary: Get user friends
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends
 */

module.exports = router;
