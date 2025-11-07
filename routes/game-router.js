/**
 * Game Router for game mechanics operations
 * Created by Claude on 15.07.2025
 */
const express = require("express");
const gameController = require("../controllers/game-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const validateTelegramWebAppData = require("../middlewares/telegram-auth-middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit-middleware");

const router = express.Router();

/**
 * @route POST /api/game/farming-reward
 * @desc Register farming reward
 * @access Private
 */
router.post(
	"/farming-reward",
	validateTelegramWebAppData,
	rateLimitMiddleware(300, 60), // 150 requests per hour (было 60*60*60, исправлено на 30, теперь 150)
	authMiddleware,
	gameController.registerFarmingReward
);

/**
 * @route POST /api/game/register-transfer-stardust-to-galaxy
 * @desc Register transfer stardust to galaxy - create offer for galaxy purchase
 * @access Private
 */
router.post(
	"/register-transfer-stardust-to-galaxy",
	validateTelegramWebAppData,
	rateLimitMiddleware(150, 60), // 150 requests per hour
	authMiddleware,
	gameController.registerTransferStardustToGalaxy
);

/**
 * @route POST /api/game/daily-reward
 * @desc Claim daily reward
 * @access Private
 */
router.post(
	"/daily-reward",
	validateTelegramWebAppData,
	rateLimitMiddleware(25, 60), // 25 requests per hour for daily rewards
	authMiddleware,
	gameController.claimDailyReward
);

/**
 * @route POST /api/game/register-generated-galaxy
 * @desc Register generated galaxy when previous galaxy is filled with stars
 * @access Private
 */
router.post(
	"/register-generated-galaxy",
	validateTelegramWebAppData,
	rateLimitMiddleware(50, 60), // 50 requests per hour
	authMiddleware,
	gameController.registerGeneratedGalaxy
);

/**
 * @route POST /api/game/register-captured-galaxy
 * @desc Register captured galaxy with tgStars offer
 * @access Private
 */
router.post(
	"/register-captured-galaxy",
	validateTelegramWebAppData,
	rateLimitMiddleware(100, 60), // 100 requests per hour
	authMiddleware,
	gameController.registerCapturedGalaxy
);

/**
 * @route POST /api/game/complete-payment
 * @desc Complete payment from Telegram webhook
 * @access Public (called by Telegram webhook)
 */
router.post(
	"/complete-payment",
	rateLimitMiddleware(500, 60), // 500 requests per hour for webhooks
	gameController.completePayment
);

/**
 * @route POST /api/game/send-collection-notification
 * @desc Send collection notification to user via Telegram bot
 * @access Private
 */
router.post(
	"/send-collection-notification",
	validateTelegramWebAppData,
	rateLimitMiddleware(150, 60), // 150 requests per hour
	authMiddleware,
	gameController.sendCollectionNotification
);

module.exports = router;
