/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const Router = require('express').Router;
const metricsController = require('../controllers/game-metrics-controller');
const authMiddleware = require('../middlewares/auth-middleware');
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
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.retention
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
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.arpu
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
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.ltv
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
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.kfactor
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
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.conversion
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

module.exports = router;
