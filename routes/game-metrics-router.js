/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const Router = require('express').Router;
const gameMetricsController = require('../controllers/game-metrics-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
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
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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
	adminMiddleware,
	rateLimitMiddleware(30, 60),
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
