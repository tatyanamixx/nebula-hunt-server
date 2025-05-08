const Router = require('express');
const router = new Router();

const authMiddleware = require('../middlewares/auth-middleware.js')
const tmaMiddleware = require('../middlewares/tma-middeware.js')
const userController = require('../controllers/userController.js');

router.post('/registration', tmaMiddleware, userController.registration);
router.post('/login', userController.login);
router.get('/refresh', userController.refresh);

router.get ('/users', userController.getLeaderBoard)

module.exports = router;
