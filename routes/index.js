const Router = require('express');
const router = new Router();

const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middeware.js');
const userController = require('../controllers/userController.js');
const galaxyController = require('../controllers/galaxyController.js');

router.post('/registration', tmaMiddleware, userController.registration);
router.post('/login', userController.login);
router.get('/refresh', userController.refresh);

router.post('/updategalaxy', galaxyController.update);
router.get('/getgalaxy/:id', galaxyController.getone);
router.get('/getusergalaxies/:id', galaxyController.getuserlist);
router.get('/getshowgalaxies/:id', galaxyController.getshowlist);

router.get('/leaderboard', userController.getleaderboard);

module.exports = router;
