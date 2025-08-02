/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const artifactController = require('../controllers/artifact-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: Artifact
 *   description: Artifact management
 */

/**
 * @swagger
 * /artifacts:
 *   get:
 *     summary: Get user artifacts
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user artifacts
 */
router.get(
	'/',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour
	authMiddleware,
	artifactController.getUserArtifacts
);

/**
 * @swagger
 * /artifacts/{artifactId}:
 *   get:
 *     summary: Get specific artifact by ID
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artifact details
 */
router.get(
	'/:artifactId',
	telegramAuthMiddleware,
	rateLimitMiddleware(60, 60), // 60 requests per hour
	authMiddleware,
	artifactController.getArtifact
);

/**
 * @swagger
 * /artifacts/generate:
 *   post:
 *     summary: Generate a new artifact
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Artifact generated successfully
 */
router.post(
	'/generate',
	telegramAuthMiddleware,
	rateLimitMiddleware(10, 60), // 10 requests per hour
	authMiddleware,
	artifactController.generateArtifact
);

/**
 * @swagger
 * /artifacts/{artifactId}/activate:
 *   post:
 *     summary: Activate an artifact
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artifact activated successfully
 */
router.post(
	'/:artifactId/activate',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour
	authMiddleware,
	artifactController.activateArtifact
);

/**
 * @swagger
 * /artifacts/{artifactId}/deactivate:
 *   post:
 *     summary: Deactivate an artifact
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artifact deactivated successfully
 */
router.post(
	'/:artifactId/deactivate',
	telegramAuthMiddleware,
	rateLimitMiddleware(30, 60), // 30 requests per hour
	authMiddleware,
	artifactController.deactivateArtifact
);

module.exports = router;
