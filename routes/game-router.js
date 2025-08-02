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
 * @route POST /api/game/farming-reward
 * @desc Register farming reward
 * @access Private
 */
router.post(
	'/farming-reward',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60), // 30 requests per hour
	authMiddleware,
	gameController.registerFarmingReward
);

/**
 * @route POST /api/game/galaxy-with-offer
 * @desc Create galaxy with offer
 * @access Private
 */
router.post(
	'/galaxy-with-offer',
	validateTelegramWebAppData,
	rateLimitMiddleware(20, 60), // 20 requests per hour
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
	rateLimitMiddleware(20, 60), // 20 requests per hour
	authMiddleware,
	gameController.createGalaxyForSale
);

/**
 * @route POST /api/game/register-transfer-stardust-to-galaxy
 * @desc Register transfer stardust to galaxy - create offer for galaxy purchase
 * @access Private
 */
router.post(
	'/register-transfer-stardust-to-galaxy',
	validateTelegramWebAppData,
	rateLimitMiddleware(30, 60), // 30 requests per hour
	authMiddleware,
	gameController.registerTransferStardustToGalaxy
);

/**
 * @route POST /api/game/daily-reward
 * @desc Claim daily reward
 * @access Private
 */
router.post(
	'/daily-reward',
	validateTelegramWebAppData,
	rateLimitMiddleware(5, 60), // 5 requests per hour for daily rewards
	authMiddleware,
	gameController.claimDailyReward
);

module.exports = router;
