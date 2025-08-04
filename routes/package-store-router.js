/**
 * created by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const packageStoreController = require('../controllers/package-store-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Get all packages for the authenticated user
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user packages
 *       401:
 *         description: Unauthorized
 */
router.get(
	'/',
	telegramAuthMiddleware,
	rateLimitMiddleware(60),
	authMiddleware,
	packageStoreController.getUserPackages
);

/**
 * @swagger
 * /packages/{slug}:
 *   get:
 *     summary: Get a specific package by slug for the authenticated user
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Package slug
 *     responses:
 *       200:
 *         description: Package details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Package not found
 */
router.get(
	'/:slug',
	telegramAuthMiddleware,
	rateLimitMiddleware(60),
	authMiddleware,
	packageStoreController.getUserPackageBySlug
);

/**
 * @swagger
 * /packages/{slug}/use:
 *   post:
 *     summary: Use a package to add resources to user state
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Package slug
 *     responses:
 *       200:
 *         description: Package used successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Package not found or already used
 */
router.post(
	'/:slug/use',
	telegramAuthMiddleware,
	rateLimitMiddleware(20),
	authMiddleware,
	packageStoreController.usePackage
);

module.exports = router;
