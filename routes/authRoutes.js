const Router = require('express');
const router = new Router();
const { authLimiter, defaultLimiter } = require('../middlewares/rate-limit.js');
const userController = require('../controllers/userController.js');
const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');

router.post(
	'/registration',
	tmaMiddleware,
	authLimiter,
	userController.registration
);
router.post('/login', tmaMiddleware, authLimiter, userController.login);
router.get('/refresh', tmaMiddleware, authLimiter, userController.refresh);
router.get(
	'/friends',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	userController.getfriends
);

module.exports = router;
