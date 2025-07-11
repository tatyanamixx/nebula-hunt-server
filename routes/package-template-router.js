/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const packageTemplateController = require('../controllers/package-template-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all package templates
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	packageTemplateController.getAllPackageTemplates
);

// Get a specific package template
router.get(
	'/:packageId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	packageTemplateController.getPackageTemplate
);

// Create a new package template
router.post(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	packageTemplateController.createPackageTemplate
);

// Update a package template
router.put(
	'/:packageId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	packageTemplateController.updatePackageTemplate
);

// Delete a package template
router.delete(
	'/:packageId',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	packageTemplateController.deletePackageTemplate
);

// Activate a package template
router.post(
	'/:packageId/activate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	packageTemplateController.activatePackageTemplate
);

// Deactivate a package template
router.post(
	'/:packageId/deactivate',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	packageTemplateController.deactivatePackageTemplate
);

module.exports = router;
