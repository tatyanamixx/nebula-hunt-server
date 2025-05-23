const Router = require('express');
const router = new Router();
const {
	defaultLimiter,
	updateLimiter,
} = require('../middlewares/rate-limit.js');
const userstateController = require('../controllers/userstateController.js');
const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');

router.post(
	'/update',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	userstateController.updateuserstate
);
router.get(
	'/leaderboard',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	userstateController.leaderboard
);

module.exports = router;
