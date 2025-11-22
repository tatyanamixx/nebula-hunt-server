/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeTemplateController = require('../controllers/upgrade-template-controller');
const adminAuthMiddleware = require('../middlewares/admin-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all upgrade templates
router.get(
	'/',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	upgradeTemplateController.getAllUpgradeNodeTemplates
);

// Get a specific upgrade template
router.get(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	upgradeTemplateController.getUpgradeNodeTemplate
);

// Create a new upgrade template
router.post(
	'/',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	upgradeTemplateController.createUpgradeTemplates
);

// Update an upgrade template
router.put(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	upgradeTemplateController.updateUpgradeNodeTemplate
);

// Delete an upgrade template
router.delete(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes,
	upgradeTemplateController.deleteUpgradeNodeTemplate
);

// Activate an upgrade template
router.post(
	'/:slug/activate',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	upgradeTemplateController.toggleUpgradeNodeTemplateActive
);

// Get upgrade node templates stats
router.get(
	'/stats',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	upgradeTemplateController.getUpgradeNodeTemplatesStats
);

module.exports = router;
