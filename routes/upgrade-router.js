/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeController = require('../controllers/upgrade-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const { param } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Upgrade
 *   description: User upgrades management
 */

// Пользовательские роуты
/**
 * @swagger
 * /upgrades/tree:
 *   get:
 *     summary: Get user upgrade tree
 *     tags: [Upgrade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User upgrade tree
 */
router.get(
	'/tree',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	upgradeController.getUserUpgradeTree
);
/**
 * @swagger
 * /upgrades/node/{nodeId}:
 *   get:
 *     summary: Get upgrade node progress
 *     tags: [Upgrade]
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
 *         description: Node progress
 */
router.get(
	'/node/:nodeId',
	[
		tmaMiddleware,
		authMiddleware,
		rateLimitMiddleware(60, 60),
		param('nodeId').isString().withMessage('nodeId must be a string'),
	],
	upgradeController.getUpgradeNodeProgress
);
/**
 * @swagger
 * /upgrades/node/{nodeId}/progress:
 *   post:
 *     summary: Update node progress
 *     tags: [Upgrade]
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
 *         description: Node progress updated
 */
router.post(
	'/node/:nodeId/progress',
	[
		tmaMiddleware,
		authMiddleware,
		rateLimitMiddleware(30, 60),
		param('nodeId').isString().withMessage('nodeId must be a string'),
	],
	upgradeController.updateNodeProgress
);
/**
 * @swagger
 * /upgrades/stats:
 *   get:
 *     summary: Get user upgrade stats
 *     tags: [Upgrade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User upgrade stats
 */
router.get(
	'/stats',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	upgradeController.getUserUpgradeStats
);

module.exports = router;
