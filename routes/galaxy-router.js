const Router = require('express').Router;
const router = new Router();
const galaxyController = require('../controllers/galaxy-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

router.post(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(10, 60)],
	galaxyController.createGalaxy
);
router.get(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	galaxyController.getGalaxies
);
router.put(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	galaxyController.updateGalaxy
);

module.exports = router;
