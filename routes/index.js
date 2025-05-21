const Router = require('express');
const router = new Router();

const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middleware.js');
const userController = require('../controllers/userController.js');
const galaxyController = require('../controllers/galaxyController.js');
const userstateController = require('../controllers/userstateController.js');
const taskController = require('../controllers/taskController.js');

router.post('/registration', tmaMiddleware, userController.registration);
router.post('/login', tmaMiddleware, userController.login);
router.get('/refresh', tmaMiddleware, userController.refresh);

router.get(
	'/friends',
	tmaMiddleware,
	authMiddleware,
	userController.getfriends
);

router.get(
	'/getgalaxy/:id',
	tmaMiddleware,
	authMiddleware,
	galaxyController.getgalaxy
);
router.get(
	'/getusergalaxies',
	tmaMiddleware,
	authMiddleware,
	galaxyController.getusergalaxies
);

router.get(
	'/getshowgalaxies',
	tmaMiddleware,
	authMiddleware,
	galaxyController.getshowgalaxies
);

router.post(
	'/updategalaxystars/:id&:stars',
	tmaMiddleware,
	authMiddleware,
	galaxyController.updategalaxystars
);
router.post(
	'/updategalaxyowner/:id&:userId',
	tmaMiddleware,
	authMiddleware,
	galaxyController.updategalaxyowner
);

router.post(
	'/updateuserstate',
	tmaMiddleware,
	authMiddleware,
	userstateController.updateuserstate
);

router.get(
	'/leaderboard',
	tmaMiddleware,
	authMiddleware,
	userstateController.leaderboard
);

// systems request
router.post('/createtasks', taskController.createtasks);

// проверено --- userId - забираем из initData после tmaMiddleware --- исправлеям в taskController!
router.post('/activateusertasks/:userId', taskController.activateusertasks);

router.get('/getusertasks/:userId', taskController.getusertasks);

router.post(
	'/completedusertask/:userId&:taskId',
	taskController.completedusertask
);



module.exports = router;
