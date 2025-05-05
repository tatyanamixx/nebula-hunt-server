const Router = require('express');
const router = new Router();
const logController = require('../controllers/logController');

router.post('/', logController.create);
// router.get('/', (req, res) => {
// 	res.status(200).json({ message: 'WORKING!' });
// });

module.exports = router;
