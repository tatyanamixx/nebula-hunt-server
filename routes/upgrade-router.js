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
	authMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeController.getUserUpgrades
);

// Get all available upgrades for the user
router.get(
	'/available',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeController.getAvailableUpgrades
);

// Get upgrade statistics for the user
router.get(
	'/stats',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeController.getUpgradeStats
);

// Get a specific upgrade for the user
router.get(
	'/:upgradeId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeController.getUserUpgrade
);

// Purchase an upgrade for the user
router.post(
	'/purchase/:upgradeId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeController.purchaseUpgrade
);

// Update progress for a user upgrade
router.put(
	'/:upgradeId/progress',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeController.updateUpgradeProgress
);

// Reset all upgrades for the user
router.post(
	'/reset',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	upgradeController.resetUpgrades
);

module.exports = router;
