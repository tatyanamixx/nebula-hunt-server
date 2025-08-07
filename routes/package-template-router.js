/**
 * created by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();
const packageTemplateController = require("../controllers/package-template-controller");
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

// Get all package templates (admin only)
router.get(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	packageTemplateController.getAllPackageTemplates
);

// Get a specific package template
router.get(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour,
	packageTemplateController.getPackageTemplate
);

// Create a new package template
router.post(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
	packageTemplateController.createPackageTemplates
);

// Update a package template
router.put(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
	packageTemplateController.updatePackageTemplate
);

// Delete a package template
router.delete(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(10, 60), // 10 requests per hour,
	packageTemplateController.deletePackageTemplate
);

// Toggle a package template status
router.put(
	"/:slug/toggle",
	adminAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour,
	packageTemplateController.togglePackageTemplateStatus
);

module.exports = router;
