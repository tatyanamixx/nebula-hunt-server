const Router = require('express');
const router = new Router();
const {
	defaultLimiter,
	updateLimiter,
} = require('../middlewares/rate-limit.js');
const galaxyController = require('../controllers/galaxyController.js');
const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');

router.get(
	'/:id',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	galaxyController.getgalaxy
);
router.get(
	'/user',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	galaxyController.getusergalaxies
);
router.get(
	'/showcase',
	tmaMiddleware,
	authMiddleware,
	defaultLimiter,
	galaxyController.getshowgalaxies
);
router.post(
	'/:id/stars/:stars',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	galaxyController.updategalaxystars
);
router.post(
	'/:id/owner/:userId',
	tmaMiddleware,
	authMiddleware,
	updateLimiter,
	galaxyController.updategalaxyowner
);

module.exports = router;
