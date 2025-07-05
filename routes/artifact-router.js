const Router = require('express').Router;
const artifactController = require('../controllers/artifact-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');

const router = Router();

// Добавить артефакт пользователю
router.post(
	'/artifact',
	authMiddleware,
	tmaMiddleware,
	artifactController.addArtifactToUser
);

// Получить список артефактов пользователя
router.get(
	'/artifact',
	authMiddleware,
	tmaMiddleware,
	artifactController.getUserArtifacts
);

// Создать артефакт от SYSTEM с офертой и инвойсом
router.post(
	'/system-offer',
	authMiddleware,
	tmaMiddleware,
	artifactController.createSystemArtifactWithOffer
);

module.exports = router;
