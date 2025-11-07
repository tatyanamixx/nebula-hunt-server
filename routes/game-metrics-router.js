/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const Router = require('express').Router;
const gameMetricsController = require('../controllers/game-metrics-controller');
const adminAuthMiddleware = require('../middlewares/admin-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Game metrics (admin only)
 */
router.get(
	'/retention',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	gameMetricsController.retention
);
/**
 * @swagger
 * /game-metrics/retention:
 *   get:
 *     summary: Get retention metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retention metrics
 */
router.get(
	'/arpu',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	gameMetricsController.arpu
);
/**
 * @swagger
 * /game-metrics/arpu:
 *   get:
 *     summary: Get ARPU metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ARPU metrics
 */
router.get(
	'/ltv',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	gameMetricsController.ltv
);
/**
 * @swagger
 * /game-metrics/ltv:
 *   get:
 *     summary: Get LTV metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: LTV metrics
 */
router.get(
	'/kfactor',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	gameMetricsController.kfactor
);
/**
 * @swagger
 * /game-metrics/kfactor:
 *   get:
 *     summary: Get K-factor metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: K-factor metrics
 */
router.get(
	'/conversion',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	gameMetricsController.conversion
);
/**
 * @swagger
 * /game-metrics/conversion:
 *   get:
 *     summary: Get conversion metrics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversion metrics
 */
router.get(
	'/update-active-users',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	gameMetricsController.updateActiveUsers
);
/**
 * @swagger
 * /game-metrics/update-active-users:
 *   get:
 *     summary: Update active users
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active users updated
 */
module.exports = router;
