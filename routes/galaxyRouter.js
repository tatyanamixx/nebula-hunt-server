const Router = require('express');
const router = new Router();
const galaxyController = require('../controllers/galaxyController');

router.post('/', galaxyController.create);

router.post('/:id', galaxyController.update);

router.get('/:id', galaxyController.getOne);

router.get('/:num', galaxyController.getList);

module.exports = router;
