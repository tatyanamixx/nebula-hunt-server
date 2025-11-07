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
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	artifactTemplateController.getAllArtifactTemplates
);

// Get a specific artifact template
router.get(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(300, 10), // 300 requests per 10 minutes,
	artifactTemplateController.getArtifactTemplateBySlug
);

// Create a new artifact template
router.post(
	"/",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	artifactTemplateController.createArtifactTemplates
);

// Update an artifact template
router.put(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(150, 10), // 150 requests per 10 minutes,
	artifactTemplateController.updateArtifactTemplate
);

// Delete an artifact template
router.delete(
	"/:slug",
	adminAuthMiddleware,
	rateLimitMiddleware(50, 10), // 50 requests per 10 minutes,
	artifactTemplateController.deleteArtifactTemplate
);

module.exports = router;
