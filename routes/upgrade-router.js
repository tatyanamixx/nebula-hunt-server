/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeController = require('../controllers/upgrade-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');

/**
 * @swagger
 * tags:
 *   name: Upgrade
 *   description: User upgrades management
 */

// Пользовательские маршруты
router.get(
	'/nodes',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	upgradeController.getUserUpgradeNodes
);

/**
 * @swagger
 * /upgrades/nodes/{nodeId}:
 *   get:
 *     summary: Get specific user upgrade node by ID
 *     tags: [Upgrade]
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
 *         description: User upgrade node details
 */
router.get(
	'/nodes/:nodeId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	upgradeController.getUserUpgradeNode
);

router.post(
	'/complete',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	upgradeController.completeUpgradeNode
);

router.post(
	'/progress',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	upgradeController.updateUpgradeProgress
);

router.get(
	'/progress/:nodeId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	upgradeController.getUpgradeProgress
);

router.post(
	'/initialize',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	upgradeController.initializeUserUpgradeTree
);

/**
 * @swagger
 * /upgrades/stats:
 *   get:
 *     summary: Get user upgrade statistics
 *     tags: [Upgrade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User upgrade statistics
 */
router.get(
	'/stats',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60),
	upgradeController.getUserUpgradeStats
);

// Административные маршруты
router.post(
	'/admin/nodes',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	upgradeController.createUpgradeNodes
);

router.get(
	'/admin/available',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	upgradeController.getAllUpgradeNodes
);

module.exports = router;
