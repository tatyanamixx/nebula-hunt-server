/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const metricsController = require('../controllers/metrics-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

const router = Router();

router.get(
	'/retention',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.retention
);
router.get(
	'/arpu',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.arpu
);
router.get(
	'/ltv',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.ltv
);
router.get(
	'/kfactor',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.kfactor
);
router.get(
	'/conversion',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	metricsController.conversion
);

module.exports = router;
