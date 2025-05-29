const Router = require('express').Router;
const router = new Router();
const achievementController = require('../controllers/achievement-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Пользовательские роуты
router.get(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	achievementController.getUserAchievements
);
router.post(
	'/:achievementId/progress',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	achievementController.updateAchievementProgress
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
	achievementController.createAchievement
);
router.put(
	'/:achievementId',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	achievementController.updateAchievement
);

module.exports = router;
