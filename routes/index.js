const Router = require('express');
const router = new Router();

const authMiddleware = require('../middlewares/auth-middleware.js');
const tmaMiddleware = require('../middlewares/tma-middeware.js');
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



// не проверено!
router.get(
	'/useractivetasks',
	tmaMiddleware,
	authMiddleware,
	taskController.useractivetasks
);

router.post(
	'/completedtask/:id',
	tmaMiddleware,
	authMiddleware,
	taskController.completedtask
);

module.exports = router;
