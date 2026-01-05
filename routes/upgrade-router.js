/**
 * created by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();
const upgradeController = require("../controllers/upgrade-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const telegramAuthMiddleware = require("../middlewares/telegram-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

// Get all upgrades for the user (existing, new, and available)
router.get(
	"/",
	telegramAuthMiddleware,
	rateLimitMiddleware(1500, 10), // 1500 requests per 10 minutes (150 per minute) - часто вызывается при открытии магазина
	authMiddleware,
	upgradeController.getAvailableUpgrades
);

// Get upgrade statistics for the user
router.get(
	"/stats",
	telegramAuthMiddleware,
	rateLimitMiddleware(1000, 10), // 1000 requests per 10 minutes
	authMiddleware,
	upgradeController.getUpgradeStats
);

// Get a specific upgrade for the user
router.get(
	"/:upgradeId",
	telegramAuthMiddleware,
	rateLimitMiddleware(1000, 10), // 1000 requests per 10 minutes
	authMiddleware,
	upgradeController.getUserUpgrade
);

// Purchase an upgrade for the user
router.post(
	"/purchase/:upgradeId",
	telegramAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes (покупки не должны быть слишком частыми)
	authMiddleware,
	upgradeController.purchaseUpgrade
);

// Update progress for a user upgrade
router.put(
	"/:upgradeId/progress",
	telegramAuthMiddleware,
	rateLimitMiddleware(500, 10), // 500 requests per 10 minutes
	authMiddleware,
	upgradeController.updateUpgradeProgress
);

// Reset all upgrades for the user
router.post(
	"/reset",
	telegramAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes,
	authMiddleware,
	upgradeController.resetUpgrades
);

module.exports = router;
