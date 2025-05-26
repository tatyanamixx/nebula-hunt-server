const Router = require('express');
const router = new Router();
const { defaultLimiter } = require('../middlewares/rate-limit.js');
const eventController = require('../controllers/eventController.js');
const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');

// User routes for interacting with events
router.get(
	'/check',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	eventController.checkEvents
);

router.get(
	'/active',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	eventController.getActiveEvents
);

module.exports = router;
