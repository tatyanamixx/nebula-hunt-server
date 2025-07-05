/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const userController = require('../controllers/user-controller');
const { body } = require('express-validator');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const authMiddleware = require('../middlewares/auth-middleware');

router.post(
	'/registration',
	[tmaMiddleware, rateLimitMiddleware(10, 60)],
	userController.registration
);
router.post(
	'/login',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	userController.login
);
router.post(
	'/logout',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(20, 60)],
	userController.logout
);
router.get(
	'/refresh',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	userController.refresh
);
router.get(
	'/friends',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	userController.getFriends
);

module.exports = router;
