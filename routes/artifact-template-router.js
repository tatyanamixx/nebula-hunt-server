/**
 * created by Claude on 15.07.2025
 */
const Router = require("express");
const router = new Router();
const artifactTemplateController = require("../controllers/artifact-template-controller");
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

// Get all artifact templates
router.get(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(300, 60), // 300 requests per hour,
	artifactTemplateController.getAllArtifactTemplates
);

// Get a specific artifact template
router.get(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(300, 60), // 300 requests per hour,
	artifactTemplateController.getArtifactTemplateBySlug
);

// Create a new artifact template
router.post(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	artifactTemplateController.createArtifactTemplates
);

// Update an artifact template
router.put(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 60), // 150 requests per hour,
	artifactTemplateController.updateArtifactTemplate
);

// Delete an artifact template
router.delete(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 60), // 50 requests per hour,
	artifactTemplateController.deleteArtifactTemplate
);

module.exports = router;
