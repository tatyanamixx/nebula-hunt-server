const Router = require('express');
const router = new Router();

const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');
const adminMiddleware = require('../middlewares/admin-middleware.js');
const {
	defaultLimiter,
	authLimiter,
	adminLimiter,
	updateLimiter,
} = require('../middlewares/rate-limit.js');
const userController = require('../controllers/userController.js');
const galaxyController = require('../controllers/galaxyController.js');
const userstateController = require('../controllers/userstateController.js');
const taskController = require('../controllers/taskController.js');
const achievementController = require('../controllers/achievementController.js');

// Auth routes
router.post(
	'/auth/registration',
	tmaMiddleware,
	authLimiter,
	userController.registration
);
router.post('/auth/login', tmaMiddleware, authLimiter, userController.login);
router.get('/auth/refresh', tmaMiddleware, authLimiter, userController.refresh);
router.get(
	'/auth/friends',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	userController.getfriends
);

// Admin routes
router.post(
	'/admin/tasks/create',
	tmaMiddleware,
	authMiddleware,
	adminMiddleware,
	adminLimiter,
	taskController.createtasks
);
router.post(
	'/admin/achievements/create',
	tmaMiddleware,
	authMiddleware,
	adminMiddleware,
	adminLimiter,
	achievementController.createachievements
);

// Galaxy routes
router.get(
	'/galaxies/:id',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	galaxyController.getgalaxy
);
router.get(
	'/galaxies/user',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	galaxyController.getusergalaxies
);
router.get(
	'/galaxies/showcase',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	galaxyController.getshowgalaxies
);
router.post(
	'/galaxies/:id/stars/:stars',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	galaxyController.updategalaxystars
);
router.post(
	'/galaxies/:id/owner/:userId',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	galaxyController.updategalaxyowner
);

// User state routes
router.post(
	'/user/state/update',
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

// Task routes
router.post(
	'/tasks/activate',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	taskController.activateusertasks
);
router.get(
	'/tasks/user',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	taskController.getusertasks
);
router.post(
	'/tasks/:taskId/complete',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	taskController.completedusertask
);

// Achievement routes
router.post(
	'/achievements/activate',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	achievementController.activateuserachivements
);
router.get(
	'/achievements/user',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	achievementController.getuserachievements
);
router.post(
	'/achievements/update',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	achievementController.updateUserAchievementByValue
);

module.exports = router;
