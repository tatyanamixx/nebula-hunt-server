const Router = require('express').Router;
const router = new Router();
const userStateController = require('../controllers/user-state-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

router.get(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	userStateController.getUserState
);
router.put(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	userStateController.updateUserState
);
router.get(
	'/leaderboard',
	[tmaMiddleware, rateLimitMiddleware(120, 60)],
	userStateController.getLeaderboard
);

module.exports = router;
