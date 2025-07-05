const Router = require('express').Router;
const marketController = require('../controllers/market-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const tmaMiddleware = require('../middlewares/tma-middleware');

const router = Router();

// Получить все оферты (публично)
router.get('/offers', marketController.getAllOffers);

// Создать оферту на продажу артефакта (требует авторизации и tma)
router.post(
	'/offer',
	authMiddleware,
	tmaMiddleware,
	marketController.createOffer
);

// Отменить оферту (требует авторизации и tma)
router.post(
	'/cancel-offer',
	authMiddleware,
	tmaMiddleware,
	marketController.cancelOffer
);

// Создать инвойс (запрос на покупку) (требует авторизации и tma)
router.post(
	'/invoice',
	authMiddleware,
	tmaMiddleware,
	marketController.createInvoice
);

// Провести сделку (оплата и передача предмета) (требует авторизации и tma)
router.post(
	'/deal',
	authMiddleware,
	tmaMiddleware,
	marketController.processDeal
);

// Создать инвойс для покупки пакета (требует авторизации и tma)
router.post(
	'/package-invoice',
	authMiddleware,
	tmaMiddleware,
	marketController.createPackageInvoice
);

// Подтвердить покупку пакета (требует авторизации и tma)
router.post(
	'/package-deal',
	authMiddleware,
	tmaMiddleware,
	marketController.processPackageDeal
);

// Отменить сделку SYSTEM (требует авторизации и tma)
router.post(
	'/cancel-system-deal',
	authMiddleware,
	tmaMiddleware,
	marketController.cancelSystemDeal
);

// Отменить сделку (требует авторизации и tma)
router.post(
	'/cancel-deal',
	authMiddleware,
	tmaMiddleware,
	marketController.cancelDeal
);

// Получить все сделки пользователя (требует авторизации и tma)
router.get(
	'/transactions',
	authMiddleware,
	tmaMiddleware,
	marketController.getUserTransactions
);

module.exports = router;
