const Router = require('express').Router;
const router = new Router();
const stateHistoryController = require('../controllers/state-history-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Получить историю состояния с фильтрацией
router.get(
	'/',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	stateHistoryController.getHistory
);

// Получить статистику по истории
router.get(
	'/stats',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(30, 60)],
	stateHistoryController.getHistoryStats
);

// Получить последние записи истории
router.get(
	'/recent',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(60, 60)],
	stateHistoryController.getRecentHistory
);

// Очистить старые записи истории
router.post(
	'/cleanup',
	[tmaMiddleware, authMiddleware, rateLimitMiddleware(10, 60)],
	stateHistoryController.cleanupHistory
);

module.exports = router;
