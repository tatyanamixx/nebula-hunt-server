/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();
const marketController = require('../controllers/market-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @swagger
 * tags:
 *   name: Market
 *   description: Market management
 */

/**
 * @swagger
 * /market/offers:
 *   get:
 *     summary: Get all market offers
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of market offers
 */
router.get(
	'/offers',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getOffers
);

/**
 * @swagger
 * /market/offers/{offerId}:
 *   get:
 *     summary: Get specific offer by ID
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer details
 */
router.get(
	'/offers/:offerId',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getOffer
);

/**
 * @swagger
 * /market/offers:
 *   post:
 *     summary: Create a new offer
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Offer created successfully
 */
router.post(
	'/offers',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.createOffer
);

/**
 * @swagger
 * /market/offers/{offerId}/cancel:
 *   post:
 *     summary: Cancel an offer
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer cancelled successfully
 */
router.post(
	'/offers/:offerId/cancel',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	marketController.cancelOffer
);

/**
 * @swagger
 * /market/offers/{offerId}/buy:
 *   post:
 *     summary: Buy an offer
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer purchased successfully
 */
router.post(
	'/offers/:offerId/buy',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.buyOffer
);

/**
 * @swagger
 * /market/transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user transactions
 */
router.get(
	'/transactions',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getUserTransactions
);

module.exports = router;
