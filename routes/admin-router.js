/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminController = require('../controllers/admin-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const eventController = require('../controllers/event-controller');
const taskController = require('../controllers/task-controller');
const upgradeController = require('../controllers/upgrade-controller');
const marketController = require('../controllers/market-controller');
const { param } = require('express-validator');
const validateTelegramWebAppData = require('../middlewares/validate-telegram-webapp-middleware');
const google2faMiddleware = require('../middlewares/google-2fa-middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and privileged actions
 */

router.get(
	'/users',
	[
		validateTelegramWebAppData,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(30, 60),
	],
	adminController.getUsers
);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */

router.post(
	'/block/:userId',
	[
		validateTelegramWebAppData,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
		param('userId').isString().withMessage('userId must be a string'),
	],
	adminController.blockUser
);

/**
 * @swagger
 * /admin/block/{userId}:
 *   post:
 *     summary: Block a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User blocked
 */

router.post(
	'/unblock/:userId',
	[
		validateTelegramWebAppData,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
		param('userId').isString().withMessage('userId must be a string'),
	],
	adminController.unblockUser
);

/**
 * @swagger
 * /admin/unblock/{userId}:
 *   post:
 *     summary: Unblock a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unblocked
 */

// --- Админ роуты для событий ---
router.post(
	'/events',
	[
		validateTelegramWebAppData,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	eventController.createGameEvent
);

/**
 * @swagger
 * /admin/events:
 *   post:
 *     summary: Create a game event
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Event created
 */

router.put(
	'/events/:eventId',
	[
		validateTelegramWebAppData,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
		param('eventId').isString().withMessage('eventId must be a string'),
	],
	eventController.updateGameEvent
);

/**
 * @swagger
 * /admin/events/{eventId}:
 *   put:
 *     summary: Update a game event
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event updated
 */

// --- Админ роуты для задач ---
router.post(
	'/tasks',
	[
		validateTelegramWebAppData,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	taskController.createTask
);

/**
 * @swagger
 * /admin/tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Task created
 */

router.put(
	'/tasks/:taskId',
	[
		validateTelegramWebAppData,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
		param('taskId').isString().withMessage('taskId must be a string'),
	],
	taskController.updateTask
);

/**
 * @swagger
 * /admin/tasks/{taskId}:
 *   put:
 *     summary: Update a task
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task updated
 */

// --- Админ роуты для апгрейдов ---
router.post(
	'/upgrades/nodes',
	[authMiddleware, adminMiddleware, rateLimitMiddleware(20, 60)],
	upgradeController.createUpgradeNodes
);

/**
 * @swagger
 * /admin/upgrades/nodes:
 *   post:
 *     summary: Create upgrade nodes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Upgrade nodes created
 */

router.put(
	'/upgrades/node/:nodeId',
	[
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
		param('nodeId').isString().withMessage('nodeId must be a string'),
	],
	upgradeController.updateUpgradeNode
);

/**
 * @swagger
 * /admin/upgrades/node/{nodeId}:
 *   put:
 *     summary: Update upgrade node
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Upgrade node updated
 */

router.delete(
	'/upgrades/node/:nodeId',
	[
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
		param('nodeId').isString().withMessage('nodeId must be a string'),
	],
	upgradeController.deleteUpgradeNode
);

/**
 * @swagger
 * /admin/upgrades/node/{nodeId}:
 *   delete:
 *     summary: Delete upgrade node
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Upgrade node deleted
 */

router.get(
	'/upgrades/nodes',
	[authMiddleware, adminMiddleware, rateLimitMiddleware(30, 60)],
	upgradeController.getAllUpgradeNodes
);

/**
 * @swagger
 * /admin/upgrades/nodes:
 *   get:
 *     summary: Get all upgrade nodes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upgrade nodes
 */

// --- Админ роут для инициализации пакетов ---
router.post(
	'/market/initialize-packages',
	[authMiddleware, adminMiddleware, rateLimitMiddleware(5, 60)],
	marketController.initializePackages
);

/**
 * @swagger
 * /admin/market/initialize-packages:
 *   post:
 *     summary: Initialize market packages
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Market packages initialized
 */

// Логин администратора через Telegram + Google 2FA
router.post(
	'/login',
	validateTelegramWebAppData,
	google2faMiddleware,
	adminController.loginAdmin
);

// Logout администратора (JWT + ADMIN)
router.post(
	'/logout',
	authMiddleware,
	adminMiddleware,
	adminController.logoutAdmin
);

// Защищённый эндпойнт для инициализации админа по Telegram id
router.post('/init', adminController.initAdmin);

module.exports = router;
