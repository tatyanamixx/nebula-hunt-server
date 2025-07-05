/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const artifactController = require('../controllers/artifact-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

const router = Router();

// Добавить артефакт пользователю
router.post(
	'/artifact',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	artifactController.addArtifactToUser
);

// Получить список артефактов пользователя
router.get(
	'/artifact',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	artifactController.getUserArtifacts
);

// Создать артефакт от SYSTEM с офертой и инвойсом
router.post(
	'/system-offer',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(5, 60),
	artifactController.createSystemArtifactWithOffer
);

module.exports = router;
