const Router = require('express');
const router = new Router();
const {
	defaultLimiter,
	updateLimiter,
} = require('../middlewares/rate-limit.js');
const taskController = require('../controllers/taskController.js');
const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');

router.post(
	'/activate',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	taskController.activateusertasks
);
router.get(
	'/user',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	taskController.getusertasks
);
router.post(
	'/:taskId/complete',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	taskController.completedusertask
);

module.exports = router;
