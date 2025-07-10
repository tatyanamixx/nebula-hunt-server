const Router = require('express');
const router = new Router();
const packageTemplateController = require('../controllers/package-template-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * /package-templates:
 *   get:
 *     summary: Get all active package templates
 *     tags: [PackageTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: sortOrder
 *         description: Field to sort by
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: List of package templates
 */
router.get(
	'/',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	packageTemplateController.getAllTemplates
);

/**
 * @swagger
 * /package-templates/{id}:
 *   get:
 *     summary: Get package template by ID
 *     tags: [PackageTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Package template ID
 *     responses:
 *       200:
 *         description: Package template
 *       404:
 *         description: Package template not found
 */
router.get(
	'/:id',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	packageTemplateController.getTemplateById
);

/**
 * @swagger
 * /package-templates/{id}/offer:
 *   post:
 *     summary: Create offer from package template (admin only)
 *     tags: [PackageTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Package template ID
 *     responses:
 *       201:
 *         description: Offer created
 *       403:
 *         description: Access denied
 *       404:
 *         description: Package template not found
 */
router.post(
	'/:id/offer',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(10, 60),
	packageTemplateController.createOfferFromTemplate
);

module.exports = router;
