/**
 * created by Claude on 15.07.2025
 */
const Router = require('express');
const router = new Router();
const artifactTemplateController = require('../controllers/artifact-template-controller');
const adminMiddleware = require('../middlewares/admin-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

// Get all artifact templates
router.get(
	'/',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	artifactTemplateController.getAllArtifactTemplates
);

// Get a specific artifact template
router.get(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(60, 60),
	artifactTemplateController.getArtifactTemplateBySlug
);

// Create a new artifact template
router.post(
	'/',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	artifactTemplateController.createArtifactTemplates
);

// Update an artifact template
router.put(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(30, 60),
	artifactTemplateController.updateArtifactTemplate
);

// Delete an artifact template
router.delete(
	'/:slug',
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	artifactTemplateController.deleteArtifactTemplate
);

module.exports = router;
