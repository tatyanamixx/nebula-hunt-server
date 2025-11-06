/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeController = require('../controllers/upgrade-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');



// Get all upgrades for the user (existing, new, and available)
router.get(
	'/',
	telegramAuthMiddleware,
	rateLimitMiddleware(300, 60), // 300 requests per hour (5 per minute) - часто вызывается при открытии магазина
	authMiddleware,
	upgradeController.getAvailableUpgrades
);

// Get upgrade statistics for the user
router.get(
	'/stats',
	telegramAuthMiddleware,
	rateLimitMiddleware(200, 60), // 200 requests per hour
	authMiddleware,
	upgradeController.getUpgradeStats
);

// Get a specific upgrade for the user
router.get(
	'/:upgradeId',
	telegramAuthMiddleware,
	rateLimitMiddleware(200, 60), // 200 requests per hour
	authMiddleware,
	upgradeController.getUserUpgrade
);

// Purchase an upgrade for the user
router.post(
	'/purchase/:upgradeId',
	telegramAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour (покупки не должны быть слишком частыми)
	authMiddleware,
	upgradeController.purchaseUpgrade
);

// Update progress for a user upgrade
router.put(
	'/:upgradeId/progress',
	telegramAuthMiddleware,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	authMiddleware,
	upgradeController.updateUpgradeProgress
);

// Reset all upgrades for the user
router.post(
	'/reset',
	telegramAuthMiddleware,
	rateLimitMiddleware(10, 60), // 10 requests per hour,
	authMiddleware,
	upgradeController.resetUpgrades
);

module.exports = router;
