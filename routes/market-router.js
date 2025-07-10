/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const Router = require('express').Router;
const marketController = require('../controllers/market-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');

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
	telegramAuthMiddleware,
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
	telegramAuthMiddleware,
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
	telegramAuthMiddleware,
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
	telegramAuthMiddleware,
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
	telegramAuthMiddleware,
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
	telegramAuthMiddleware,
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
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getUserTransactions
);

// Регистрация фарминга ресурсов (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/farming-reward:
 *   post:
 *     summary: Register farming reward
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farming reward registered
 */
router.post(
	'/farming-reward',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.registerFarmingReward
);

// Регистрация оплаты апгрейда (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/upgrade-payment:
 *   post:
 *     summary: Register upgrade payment
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upgrade payment registered
 */
router.post(
	'/upgrade-payment',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.registerUpgradePayment
);

// Регистрация награды за задачу (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/task-reward:
 *   post:
 *     summary: Register task reward
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task reward registered
 */
router.post(
	'/task-reward',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.registerTaskReward
);

// Регистрация награды за событие (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/event-reward:
 *   post:
 *     summary: Register event reward
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event reward registered
 */
router.post(
	'/event-reward',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.registerEventReward
);

// Регистрация передачи звезд в галактику (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/galaxy-stars-transfer:
 *   post:
 *     summary: Register galaxy stars transfer
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Galaxy stars transfer registered
 */
router.post(
	'/galaxy-stars-transfer',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.registerGalaxyStarsTransfer
);

// Создание оферты на продажу ресурсов (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/resource-offer:
 *   post:
 *     summary: Create resource offer
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Resource offer created
 */
router.post(
	'/resource-offer',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.createResourceOffer
);

// Обмен ресурсами между пользователями (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/exchange-resources:
 *   post:
 *     summary: Exchange resources between users
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resources exchanged
 */
router.post(
	'/exchange-resources',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.exchangeResources
);

// Обновление TON-кошелька пользователя (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/ton-wallet:
 *   put:
 *     summary: Update TON wallet address
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TON wallet updated
 */
router.put(
	'/ton-wallet',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	marketController.updateTonWallet
);

// Получение TON-кошелька пользователя (требует tma, авторизации и rate limiting)
/**
 * @swagger
 * /market/ton-wallet:
 *   get:
 *     summary: Get TON wallet address
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TON wallet address
 */
router.get(
	'/ton-wallet',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getTonWallet
);

// Получение всех оферт с пагинацией и фильтрацией
/**
 * @swagger
 * /market/offers:
 *   get:
 *     summary: Get all offers with pagination and filtering
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: itemType
 *         schema:
 *           type: string
 *           enum: [galaxy, artifact, resource, package]
 *         description: Type of item
 *       - in: query
 *         name: offerType
 *         schema:
 *           type: string
 *           enum: [SYSTEM, P2P]
 *         description: Type of offer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *         description: Status of offer
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [tgStars, stardust, darkMatter, tonToken]
 *         description: Currency of offer
 *     responses:
 *       200:
 *         description: List of offers with pagination
 */
router.get(
	'/offers',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getOffers
);

// Получение оферт галактик с пагинацией
/**
 * @swagger
 * /market/offers/galaxy:
 *   get:
 *     summary: Get galaxy offers with pagination
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *         description: Status of offer
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [tgStars, stardust, darkMatter, tonToken]
 *         description: Currency of offer
 *     responses:
 *       200:
 *         description: List of galaxy offers with pagination
 */
router.get(
	'/offers/galaxy',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getGalaxyOffers
);

// Получение оферт ресурсов с пагинацией
/**
 * @swagger
 * /market/offers/resource:
 *   get:
 *     summary: Get resource offers with pagination
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [stardust, darkMatter, tgStars]
 *         description: Type of resource
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *         description: Status of offer
 *     responses:
 *       200:
 *         description: List of resource offers with pagination
 */
router.get(
	'/offers/resource',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getResourceOffers
);

// Получение оферт артефактов с пагинацией
/**
 * @swagger
 * /market/offers/artifact:
 *   get:
 *     summary: Get artifact offers with pagination
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *         description: Status of offer
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [tgStars, stardust, darkMatter, tonToken]
 *         description: Currency of offer
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [COMMON, UNCOMMON, RARE, EPIC, LEGENDARY]
 *         description: Rarity of artifact
 *     responses:
 *       200:
 *         description: List of artifact offers with pagination
 */
router.get(
	'/offers/artifact',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getArtifactOffers
);

// Получение P2P оферт с пагинацией
/**
 * @swagger
 * /market/offers/p2p:
 *   get:
 *     summary: Get P2P offers with pagination
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *         description: Status of offer
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [tgStars, stardust, darkMatter, tonToken]
 *         description: Currency of offer
 *       - in: query
 *         name: itemType
 *         schema:
 *           type: string
 *           enum: [galaxy, artifact, resource, package]
 *         description: Type of item
 *     responses:
 *       200:
 *         description: List of P2P offers with pagination
 */
router.get(
	'/offers/p2p',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getP2POffers
);

// Получение системных оферт с пагинацией
/**
 * @swagger
 * /market/offers/system:
 *   get:
 *     summary: Get system offers with pagination
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED, EXPIRED]
 *         description: Status of offer
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [tgStars, stardust, darkMatter, tonToken]
 *         description: Currency of offer
 *       - in: query
 *         name: itemType
 *         schema:
 *           type: string
 *           enum: [galaxy, artifact, resource, package]
 *         description: Type of item
 *     responses:
 *       200:
 *         description: List of system offers with pagination
 */
router.get(
	'/offers/system',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getSystemOffers
);

// Отмена оферты
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
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the offer to cancel
 *     responses:
 *       200:
 *         description: Offer cancelled successfully
 *       400:
 *         description: Can only cancel active offers
 *       403:
 *         description: You don't have permission to cancel this offer
 *       404:
 *         description: Offer not found
 */
router.post(
	'/offers/:offerId/cancel',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.cancelOffer
);

// Покупка оферты
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
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the offer to buy
 *     responses:
 *       200:
 *         description: Offer purchased successfully
 *       400:
 *         description: Can only buy active offers or insufficient funds
 *       404:
 *         description: Offer not found
 */
router.post(
	'/offers/:offerId/buy',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.buyOffer
);

// Обработка истекших оферт (только для администраторов)
/**
 * @swagger
 * /market/offers/process-expired:
 *   post:
 *     summary: Process expired offers
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired offers processed successfully
 *       403:
 *         description: Access denied
 */
router.post(
	'/offers/process-expired',
	telegramAuthMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	marketController.processExpiredOffers
);

// Инициализация пакетов (требует tma, авторизации, прав админа и rate limiting)
/**
 * @swagger
 * /market/initialize-packages:
 *   post:
 *     summary: Initialize market packages (admin only)
 *     tags: [Market]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Market packages initialized
 */
router.post(
	'/initialize-packages',
	telegramAuthMiddleware,
	authMiddleware,
	adminMiddleware,
	rateLimitMiddleware(5, 60),
	marketController.initializePackages
);

module.exports = router;
