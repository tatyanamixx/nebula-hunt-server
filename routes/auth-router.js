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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               referral:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User logged in
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
