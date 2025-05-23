const Router = require('express');
const router = new Router();
const { adminLimiter } = require('../middlewares/rate-limit.js');
const taskController = require('../controllers/taskController.js');
const achievementController = require('../controllers/achievementController.js');
const authMiddleware = require('../middlewares/auth-middleware.js');
const adminMiddleware = require('../middlewares/admin-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');

router.post(
	'/tasks/create',
	tmaMiddleware,
	authMiddleware,
	adminMiddleware,
	adminLimiter,
	taskController.createtasks
);
router.post(
	'/achievements/create',
	tmaMiddleware,
	authMiddleware,
	adminMiddleware,
	adminLimiter,
	achievementController.createachievements
);

module.exports = router;
