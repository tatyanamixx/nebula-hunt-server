/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const Router = require('express').Router;
const marketController = require('../controllers/market-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

const router = Router();

// Получить все оферты (публично)
router.get('/offers', marketController.getAllOffers);

// Создать оферту на продажу (требует tma, авторизации и rate limiting)
router.post(
	'/offer',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	marketController.createOffer
);

// Отменить оферту (требует tma, авторизации и rate limiting)
router.post(
	'/cancel-offer',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.cancelOffer
);

// Создать инвойс (запрос на покупку, для любого типа оферты) (требует tma, авторизации и rate limiting)
router.post(
	'/invoice',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	marketController.createInvoice
);

// Провести сделку (оплата и передача предмета, для любого типа оферты) (требует tma, авторизации и rate limiting)
router.post(
	'/deal',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(30, 60),
	marketController.processDeal
);

// Отменить сделку SYSTEM (требует tma, авторизации и rate limiting)
router.post(
	'/cancel-system-deal',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(10, 60),
	marketController.cancelSystemDeal
);

// Отменить сделку (требует tma, авторизации и rate limiting)
router.post(
	'/cancel-deal',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(20, 60),
	marketController.cancelDeal
);

// Получить все сделки пользователя (требует tma, авторизации и rate limiting)
router.get(
	'/transactions',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(60, 60),
	marketController.getUserTransactions
);

// Инициализация пакетов (требует tma, авторизации и rate limiting)
router.post(
	'/initialize-packages',
	tmaMiddleware,
	authMiddleware,
	rateLimitMiddleware(5, 60),
	marketController.initializePackages
);

module.exports = router;
