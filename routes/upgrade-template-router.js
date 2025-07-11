/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeTemplateController = require('../controllers/upgrade-template-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all upgrade templates
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeTemplateController.getAllUpgradeTemplates
);

// Get a specific upgrade template
router.get(
	'/:upgradeId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeTemplateController.getUpgradeTemplate
);

// Create a new upgrade template
router.post(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.createUpgradeTemplate
);

// Update an upgrade template
router.put(
	'/:upgradeId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.updateUpgradeTemplate
);

// Delete an upgrade template
router.delete(
	'/:upgradeId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	upgradeTemplateController.deleteUpgradeTemplate
);

// Activate an upgrade template
router.post(
	'/:upgradeId/activate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.activateUpgradeTemplate
);

// Deactivate an upgrade template
router.post(
	'/:upgradeId/deactivate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.deactivateUpgradeTemplate
);

module.exports = router;
