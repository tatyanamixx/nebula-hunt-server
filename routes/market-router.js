/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const Router = require('express').Router;
const marketController = require('../controllers/market-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Market
 *   description: Marketplace operations
 */

// Получить все оферты (публично)
/**
 * @swagger
 * /market/offers:
 *   get:
 *     summary: Get all offers
 *     tags: [Market]
 *     responses:
 *       200:
 *         description: List of offers
 */
router.get('/offers', marketController.getAllOffers);

// Создать оферту на продажу (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/offer:
 *   post:
 *     summary: Create an offer
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Offer created
 */
router.post(
	'/offer',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	marketController.createOffer
);

// Отменить оферту (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/cancel-offer:
 *   post:
 *     summary: Cancel an offer
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offer cancelled
 */
router.post(
	'/cancel-offer',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.cancelOffer
);

// Создать инвойс (запрос на покупку, для любого типа оферты) (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/invoice:
 *   post:
 *     summary: Create an invoice
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post(
	'/invoice',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	marketController.createInvoice
);

// Провести сделку (оплата и передача предмета, для любого типа оферты) (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/deal:
 *   post:
 *     summary: Process a deal
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deal processed
 */
router.post(
	'/deal',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	marketController.processDeal
);

// Отменить сделку SYSTEM (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/cancel-system-deal:
 *   post:
 *     summary: Cancel a system deal
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System deal cancelled
 */
router.post(
	'/cancel-system-deal',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	marketController.cancelSystemDeal
);

// Отменить сделку (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/cancel-deal:
 *   post:
 *     summary: Cancel a deal
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deal cancelled
 */
router.post(
	'/cancel-deal',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.cancelDeal
);

// Получить все сделки пользователя (требует tma, авторизации и rate limiting)
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
 *         description: List of transactions
 */
router.get(
	'/transactions',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getUserTransactions
);

module.exports = router;
