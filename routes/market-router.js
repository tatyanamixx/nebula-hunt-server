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

// Получить все сделки пользователя (требует авторизации и tma)
router.get(
	'/transactions/:userId',
	authMiddleware,
	tmaMiddleware,
	marketController.getUserTransactions
);

module.exports = router;
