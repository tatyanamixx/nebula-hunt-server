const Router = require('express').Router;
const router = new Router();
const upgradeController = require('../controllers/upgrade-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');

// Пользовательские роуты
router.get(
	'/tree',
	[tmaMiddleware, authMiddleware],
	upgradeController.getUserUpgradeTree
);
router.get(
	'/node/:nodeName',
	[tmaMiddleware, authMiddleware],
	upgradeController.getUpgradeNodeProgress
);
router.post(
	'/node/:nodeName/progress',
	[tmaMiddleware, authMiddleware],
	upgradeController.updateNodeProgress
);
router.get(
	'/stats',
	[tmaMiddleware, authMiddleware],
	upgradeController.getUserUpgradeStats
);

// Административные роуты
router.post(
	'/admin/nodes',
	[tmaMiddleware, authMiddleware, adminMiddleware],
	upgradeController.createUpgradeNodes
);
router.put(
	'/admin/node/:nodeName',
	[tmaMiddleware, authMiddleware, adminMiddleware],
	upgradeController.updateUpgradeNode
);
router.delete(
	'/admin/node/:nodeName',
	[tmaMiddleware, authMiddleware, adminMiddleware],
	upgradeController.deleteUpgradeNode
);
router.get(
	'/admin/nodes',
	[tmaMiddleware, authMiddleware, adminMiddleware],
	upgradeController.getAllUpgradeNodes
);

module.exports = router;
