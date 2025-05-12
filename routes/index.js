const Router = require('express');
const router = new Router();

const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middeware.js');
const userController = require('../controllers/userController.js');
const galaxyController = require('../controllers/galaxyController.js');

router.post('/registration', tmaMiddleware, userController.registration);
router.post('/login', tmaMiddleware, userController.login);

router.get('/refresh', userController.refresh);

router.post('/updategalaxystars/:id&:stars', galaxyController.updatestars);
router.post('/updategalaxyparams', galaxyController.updateparams);
router.get('/getgalaxy/:id', galaxyController.getone);
router.get('/getusergalaxies/:id', galaxyController.getuserlist);
router.get('/getshowgalaxies/:id', galaxyController.getshowlist);

router.get(
	'/leaderboard',
	tmaMiddleware,
	authMiddleware,
	userController.leaderboard
);

module.exports = router;
