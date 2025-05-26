const Router = require('express');
const router = new Router();
const { adminLimiter } = require('../middlewares/rate-limit.js');
const taskController = require('../controllers/taskController.js');
const achievementController = require('../controllers/achievementController.js');
const eventController = require('../controllers/eventController.js');
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

router.post(
	'/events/create',
	tmaMiddleware,
	authMiddleware,
	adminMiddleware,
	adminLimiter,
	eventController.createEvent
);

module.exports = router;
