/**
 * Game Router for game mechanics operations
 * Created by Claude on 15.07.2025
 */
const express = require('express');
const gameController = require('../controllers/game-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const validateTelegramWebAppData = require('../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

const router = express.Router();

/**
 * @route POST /api/game/upgrade-payment
 * @desc Register upgrade payment
 * @access Private
 */
router.post(
	'/upgrade-payment',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	gameController.registerUpgradePayment
);

/**
 * @route POST /api/game/task-reward
 * @desc Register task reward
 * @access Private
 */
router.post(
	'/task-reward',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	gameController.registerTaskReward
);

/**
 * @route POST /api/game/event-reward
 * @desc Register event reward
 * @access Private
 */
router.post(
	'/event-reward',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	gameController.registerEventReward
);

/**
 * @route POST /api/game/farming-reward
 * @desc Register farming reward
 * @access Private
 */
router.post(
	'/farming-reward',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	gameController.registerFarmingReward
);

/**
 * @route POST /api/game/stars-transfer
 * @desc Register stars transfer
 * @access Private
 */
router.post(
	'/stars-transfer',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	gameController.registerStarsTransfer
);

/**
 * @route POST /api/game/galaxy-with-offer
 * @desc Create galaxy with offer
 * @access Private
 */
router.post(
	'/galaxy-with-offer',
	validateTelegramWebAppData,
	rateLimitMiddleware(20, 60),
	authMiddleware,
	gameController.createGalaxyWithOffer
);

/**
 * @route POST /api/game/galaxy-for-sale
 * @desc Create galaxy for sale
 * @access Private
 */
router.post(
	'/galaxy-for-sale',
	validateTelegramWebAppData,
	rateLimitMiddleware(20, 60),
	authMiddleware,
	gameController.createGalaxyForSale
);

/**
 * @route POST /api/game/transfer-stars
 * @desc Transfer stars to user
 * @access Private
 */
router.post(
	'/transfer-stars',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60),
	authMiddleware,
	gameController.transferStarsToUser
);

module.exports = router;
