/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const adminController = require('../controllers/admin-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

router.get(
	'/users',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(30, 60),
	],
	adminController.getUsers
);
router.post(
	'/block/:userId',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	adminController.blockUser
);
router.post(
	'/unblock/:userId',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	adminController.unblockUser
);

module.exports = router;
