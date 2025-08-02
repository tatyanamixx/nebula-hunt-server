/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeController = require('../controllers/upgrade-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all upgrades for the user
router.get(
	'/',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	authMiddleware,
	upgradeController.getUserUpgrades
);

// Get all available upgrades for the user
router.get(
	'/available',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	authMiddleware,
	upgradeController.getAvailableUpgrades
);

// Get upgrade statistics for the user
router.get(
	'/stats',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	authMiddleware,
	upgradeController.getUpgradeStats
);

// Get a specific upgrade for the user
router.get(
	'/:upgradeId',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	authMiddleware,
	upgradeController.getUserUpgrade
);

// Purchase an upgrade for the user
router.post(
	'/purchase/:upgradeId',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
	authMiddleware,
	upgradeController.purchaseUpgrade
);

// Update progress for a user upgrade
router.put(
	'/:upgradeId/progress',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
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
