/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const eventController = require('../controllers/event-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Пользовательские роуты
router.get(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	eventController.getUserEvents
);
router.get(
	'/check',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	eventController.checkEvents
);

// Административные роуты
router.post(
	'/',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	eventController.createGameEvent
);
router.put(
	'/:eventId',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	eventController.updateGameEvent
);

module.exports = router;
