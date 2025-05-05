const Router = require('express');
const router = new Router();

const userController = require('../controllers/userController.js');

router.post('/registration', userController.registration);
router.post('/login', userController.login);

router.get('/auth', userController.auth);
router.get('/refresh', userController.refresh);
router.get ('/users', userController.getUsers)

module.exports = router;
