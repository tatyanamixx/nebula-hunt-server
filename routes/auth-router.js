const Router = require('express').Router;
const router = new Router();
const userController = require('../controllers/user-controller');
const { body } = require('express-validator');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');

router.post(
	'/registration',
	[tmaMiddleware, rateLimitMiddleware(10, 60)],
	userController.registration
);
router.post(
	'/login',
	[tmaMiddleware, rateLimitMiddleware(30, 60)],
	userController.login
);
router.post(
	'/logout',
	[tmaMiddleware, rateLimitMiddleware(20, 60)],
	userController.logout
);
router.get(
	'/refresh',
	[tmaMiddleware, rateLimitMiddleware(30, 60)],
	userController.refresh
);
router.get(
	'/friends',
	[tmaMiddleware, rateLimitMiddleware(60, 60)],
	userController.getFriends
);

module.exports = router;
