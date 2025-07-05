/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeController = require('../controllers/upgrade-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Пользовательские роуты
router.get(
	'/tree',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	upgradeController.getUserUpgradeTree
);
router.get(
	'/node/:nodeId',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	upgradeController.getUpgradeNodeProgress
);
router.post(
	'/node/:nodeId/progress',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	upgradeController.updateNodeProgress
);
router.get(
	'/stats',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	upgradeController.getUserUpgradeStats
);

// Административные роуты
router.post(
	'/admin/nodes',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	upgradeController.createUpgradeNodes
);

router.put(
	'/admin/node/:nodeId',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	upgradeController.updateUpgradeNode
);
router.delete(
	'/admin/node/:nodeId',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(20, 60),
	],
	upgradeController.deleteUpgradeNode
);
router.get(
	'/admin/nodes',
	[
		tmaMiddleware,
		authMiddleware,
		adminMiddleware,
		rateLimitMiddleware(30, 60),
	],
	upgradeController.getAllUpgradeNodes
);

module.exports = router;
