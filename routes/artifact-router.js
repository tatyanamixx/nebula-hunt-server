/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const Router = require('express').Router;
const artifactController = require('../controllers/artifact-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Artifact
 *   description: User artifacts
 */

// Добавить артефакт пользователю
router.post(
	'/artifact',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	artifactController.addArtifactToUser
);

/**
 * @swagger
 * /artifact/artifact:
 *   post:
 *     summary: Add artifact to user
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Artifact added
 */

// Получить список артефактов пользователя
router.get(
	'/artifact',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	artifactController.getUserArtifacts
);

/**
 * @swagger
 * /artifact/artifact:
 *   get:
 *     summary: Get user artifacts
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user artifacts
 */

// Создать артефакт от SYSTEM с офертой и инвойсом
router.post(
	'/system-offer',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(5, 60),
	artifactController.createSystemArtifactWithOffer
);

/**
 * @swagger
 * /artifact/system-offer:
 *   post:
 *     summary: Create system artifact with offer
 *     tags: [Artifact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: System artifact created with offer
 */

module.exports = router;
