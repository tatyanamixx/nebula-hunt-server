/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const packageTemplateController = require('../controllers/package-template-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all package templates
router.get(
	'/',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	packageTemplateController.getAllPackageTemplates
);

// Get a specific package template
router.get(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	packageTemplateController.getPackageTemplate
);

// Create a new package template
router.post(
	'/',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	packageTemplateController.createPackageTemplates
);

// Update a package template
router.put(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	packageTemplateController.updatePackageTemplate
);

// Delete a package template
router.delete(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	packageTemplateController.deletePackageTemplate
);

// Toggle a package template status
router.put(
	'/:slug/toggle',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	packageTemplateController.togglePackageTemplateStatus
);

module.exports = router;
