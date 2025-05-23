const Router = require('express');
const router = new Router();
const {
	defaultLimiter,
	updateLimiter,
} = require('../middlewares/rate-limit.js');
const achievementController = require('../controllers/achievementController.js');
const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');

router.post(
	'/activate',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	achievementController.activateuserachivements
);
router.get(
	'/user',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	achievementController.getuserachievements
);
router.post(
	'/update',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	achievementController.updateUserAchievementByValue
);

module.exports = router;
