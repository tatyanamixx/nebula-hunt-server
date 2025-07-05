/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const metricsController = require('../controllers/metrics-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');

const router = Router();

router.get(
	'/retention',
	authMiddleware,
	tmaMiddleware,
	metricsController.retention
);
router.get('/arpu', authMiddleware, tmaMiddleware, metricsController.arpu);
router.get('/ltv', authMiddleware, tmaMiddleware, metricsController.ltv);
router.get(
	'/kfactor',
	authMiddleware,
	tmaMiddleware,
	metricsController.kfactor
);
router.get(
	'/conversion',
	authMiddleware,
	tmaMiddleware,
	metricsController.conversion
);

module.exports = router;
