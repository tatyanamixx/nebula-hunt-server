const Router = require('express');
const router = new Router();

const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middeware.js');
const userController = require('../controllers/userController.js');
const galaxyController = require('../controllers/galaxyController.js');
const userstateController = require('../controllers/userstateController.js');

router.post('/registration', tmaMiddleware, userController.registration);
router.post('/login', tmaMiddleware, userController.login);
router.get('/refresh', userController.refresh);

router.get('/getgalaxy/:id', galaxyController.getgalaxy);
router.get('/getusergalaxies/:id', galaxyController.getusergalaxies);
router.get('/getshowgalaxies/:id', galaxyController.getshowgalaxies);

router.post('/updategalaxystars/:id&:stars', galaxyController.updategalaxystars);
router.post('/updategalaxyparams', galaxyController.updateparams);

router.get(
	'/leaderboard',
	tmaMiddleware,
	authMiddleware,
	userstateController.leaderboard
);

module.exports = router;
