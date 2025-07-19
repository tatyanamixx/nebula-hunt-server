/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const upgradeTemplateController = require('../controllers/upgrade-template-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all upgrade templates
router.get(
	'/',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeTemplateController.getAllUpgradeNodeTemplates
);

// Get a specific upgrade template
router.get(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	upgradeTemplateController.getUpgradeNodeTemplate
);

// Create a new upgrade template
router.post(
	'/',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.createUpgradeTemplates
);

// Update an upgrade template
router.put(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.updateUpgradeNodeTemplate
);

// Delete an upgrade template
router.delete(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	upgradeTemplateController.deleteUpgradeNodeTemplate
);

// Activate an upgrade template
router.post(
	'/:slug/activate',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.toggleUpgradeNodeTemplateActive
);

// Get upgrade node templates stats
router.get(
	'/stats',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	upgradeTemplateController.getUpgradeNodeTemplatesStats
);

module.exports = router;
