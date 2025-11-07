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
	rateLimitMiddleware(300, 60), // 300 requests per hour,
	upgradeTemplateController.getAllUpgradeNodeTemplates
);

// Get a specific upgrade template
router.get(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(300, 60), // 300 requests per hour,
	upgradeTemplateController.getUpgradeNodeTemplate
);

// Create a new upgrade template
router.post(
	'/',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	upgradeTemplateController.createUpgradeTemplates
);

// Update an upgrade template
router.put(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	upgradeTemplateController.updateUpgradeNodeTemplate
);

// Delete an upgrade template
router.delete(
	'/:slug',
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour,
	upgradeTemplateController.deleteUpgradeNodeTemplate
);

// Activate an upgrade template
router.post(
	'/:slug/activate',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	upgradeTemplateController.toggleUpgradeNodeTemplateActive
);

// Get upgrade node templates stats
router.get(
	'/stats',
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	upgradeTemplateController.getUpgradeNodeTemplatesStats
);

module.exports = router;
