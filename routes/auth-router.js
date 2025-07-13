/**
 * created by Tatyana Mikhniukevich on 01.06.2025
 */
const Router = require('express').Router;
const router = new Router();
const userController = require('../controllers/user-controller');
const { body } = require('express-validator');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const authMiddleware = require('../middlewares/auth-middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and session management
 */

router.post(
	'/registration',
	[telegramAuthMiddleware, rateLimitMiddleware(10, 60)],
	userController.registration
);

/**
 * @swagger
 * /auth/registration:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referral:
 *                 type: string
 *                 description: Referral code (number, bigint, or numeric string)
 *               userState:
 *                 type: object
 *                 description: Initial user state
 *               galaxies:
 *                 type: array
 *                 description: Initial galaxies data
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request - invalid referral format
 */

router.post(
	'/login',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	userController.login
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: No body parameters required - authentication is handled via Telegram WebApp initData
 *     responses:
 *       200:
 *         description: User logged in successfully
 */

router.post(
	'/logout',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(20, 60)],
	userController.logout
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out
 */

router.get(
	'/refresh',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	userController.refresh
);

/**
 * @swagger
 * /auth/refresh:
 *   get:
 *     summary: Refresh user session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session refreshed
 */

router.get(
	'/friends',
	[telegramAuthMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
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
