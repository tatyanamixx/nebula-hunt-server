/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express');
const router = new Router();
const adminController = require('../controllers/admin-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const eventController = require('../controllers/event-controller');
const taskController = require('../controllers/task-controller');
const upgradeController = require('../controllers/upgrade-controller');
const marketController = require('../controllers/market-controller');
const packageTemplateController = require('../controllers/package-template-controller');
const { param } = require('express-validator');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and privileged actions
 */

router.get(
	'/users',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	param('userId').isString().withMessage('userId must be a string'),
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
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	param('userId').isString().withMessage('userId must be a string'),
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
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	eventController.createEvents
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
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	param('eventId').isString().withMessage('eventId must be a string'),
	eventController.updateEvent
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
 *           type: string
 *     responses:
 *       200:
 *         description: Event updated
 */

// --- Админ роуты для задач ---
router.post(
	'/tasks',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	taskController.createTasks
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
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	param('taskId').isString().withMessage('taskId must be a string'),
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
 *           type: string
 *     responses:
 *       200:
 *         description: Task updated
 */

// --- Админ роуты для апгрейдов ---
router.post(
	'/upgrades/nodes',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
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
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	param('nodeId').isString().withMessage('nodeId must be a string'),
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
 *           type: string
 *     responses:
 *       200:
 *         description: Upgrade node updated
 */

router.delete(
	'/upgrades/node/:nodeId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(20, 60),
	param('nodeId').isString().withMessage('nodeId must be a string'),
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
 *           type: string
 *     responses:
 *       200:
 *         description: Upgrade node deleted
 */

router.get(
	'/upgrades/nodes',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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

// Шаг 1: Проверка Telegram WebApp данных и получение OTP кода
router.post('/verify-2fa', telegramAuthMiddleware, adminController.verify2FA);

/**
 * @swagger
 * /admin/verify-2fa:
 *   post:
 *     summary: Verify 2FA code for admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 description: 2FA code
 *     responses:
 *       200:
 *         description: 2FA verification successful
 *       401:
 *         description: Invalid 2FA code
 *       403:
 *         description: Access denied
 */

// Шаг 2: Логин админа после проверки 2FA
router.post('/login', telegramAuthMiddleware, adminController.loginAdmin);

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Login as admin
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Admin login successful
 *       403:
 *         description: Access denied
 */

// Выход админа из системы
router.post(
	'/logout',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	adminController.logoutAdmin
);

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     summary: Logout admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logout successful
 */

// Защищённый эндпойнт для инициализации админа по Telegram id
router.post('/init', adminController.initAdmin);

/**
 * @swagger
 * /admin/init:
 *   post:
 *     summary: Initialize admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegramId:
 *                 type: string
 *                 description: Telegram user ID
 *               secretKey:
 *                 type: string
 *                 description: Secret key for admin initialization
 *     responses:
 *       201:
 *         description: Admin initialized
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Invalid secret key
 */

/**
 * @swagger
 * /admin/package-templates:
 *   post:
 *     summary: Create a new package template (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: integer
 *               currencyGame:
 *                 type: string
 *                 enum: [stardust, darkMatter]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [tgStars, tonToken]
 *               imageUrl:
 *                 type: string
 *               category:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isPromoted:
 *                 type: boolean
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Package template created
 *       403:
 *         description: Access denied
 */
router.post(
	'/package-templates',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	packageTemplateController.createTemplate
);

/**
 * @swagger
 * /admin/package-templates/{id}:
 *   put:
 *     summary: Update package template (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Package template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: integer
 *               currencyGame:
 *                 type: string
 *                 enum: [stardust, darkMatter]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [tgStars, tonToken]
 *               imageUrl:
 *                 type: string
 *               category:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isPromoted:
 *                 type: boolean
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Package template updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Package template not found
 */
router.put(
	'/package-templates/:id',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	packageTemplateController.updateTemplate
);

/**
 * @swagger
 * /admin/package-templates/{id}/status:
 *   patch:
 *     summary: Change package template status (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Package template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Package template status updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Package template not found
 */
router.patch(
	'/package-templates/:id/status',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	packageTemplateController.changeTemplateStatus
);

module.exports = router;
