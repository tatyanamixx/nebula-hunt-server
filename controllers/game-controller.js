/**
 * Game Controller for game mechanics operations
 * Created by Claude on 15.07.2025
 */
const gameService = require("../service/game-service");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");
const logger = require("../service/logger-service");
const axios = require("axios");

class GameController {
	/**
	 * Register farming reward
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerFarmingReward(req, res, next) {
		try {
			const { offerData, galaxyData } = req.body;

			logger.debug("registerFarmingReward request", { offerData, galaxyData });

			// Validate required fields
			if (!offerData) {
				throw ApiError.BadRequest(
					"offerData is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			const result = await gameService.registerFarmingReward(
				req.user.id,
				offerData,
				galaxyData
			);

			logger.info("Farming reward registered successfully", {
				userId: req.user.id,
				offerData,
				galaxyData,
			});

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Transfer stars to user
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */

	/**
	 * Register transfer stardust to galaxy - create offer for galaxy purchase
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerTransferStardustToGalaxy(req, res, next) {
		try {
			const { galaxy, reward } = req.body;
			const userId = req.user.id;

			logger.debug("registerTransferStardustToGalaxy request", {
				userId,
				galaxy,
				reward,
			});

			if (!galaxy) {
				throw ApiError.BadRequest(
					"Galaxy data is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (!reward) {
				throw ApiError.BadRequest(
					"Reward data is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate galaxy data
			if (!galaxy.seed) {
				throw ApiError.BadRequest(
					"Galaxy seed is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate reward data
			if (
				!reward.currency ||
				!reward.price ||
				!reward.resource ||
				!reward.amount
			) {
				throw ApiError.BadRequest(
					"Reward must have currency, price, resource, and amount",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate price and amount are positive
			if (reward.price <= 0) {
				throw ApiError.BadRequest(
					"Price must be positive",
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			if (reward.amount <= 0) {
				throw ApiError.BadRequest(
					"Amount must be positive",
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			const result = await gameService.registerTransferStardustToGalaxy(
				userId,
				galaxy,
				reward
			);

			logger.info("Galaxy purchase offer registered successfully", {
				userId,
				galaxySeed: galaxy.seed,
				price: reward.price,
				currency: reward.currency,
				amount: reward.amount,
				resource: reward.resource,
			});

			res.status(200).json({
				success: true,
				message: "Galaxy purchase offer registered successfully",
				data: result.data,
			});
		} catch (error) {
			logger.error("Failed to register transfer stardust to galaxy", {
				userId: req.body?.userId,
				error: error.message,
				galaxy: req.body?.galaxy,
				reward: req.body?.reward,
			});
			next(error);
		}
	}

	/**
	 * Claim daily reward for user
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async claimDailyReward(req, res, next) {
		try {
			const userId = req.initData.id;

			logger.debug("claimDailyReward request", {
				userId,
			});

			const result = await gameService.claimDailyReward(userId);

			logger.info("Daily reward claimed successfully", {
				userId,
				currentStreak: result.data.currentStreak,
				maxStreak: result.data.maxStreak,
				rewards: result.data.rewards,
			});

			res.status(200).json({
				success: true,
				message: "Daily reward claimed successfully",
				data: result.data,
			});
		} catch (error) {
			logger.error("Failed to claim daily reward", {
				userId: req.initData?.id,
				error: error.message,
			});
			next(error);
		}
	}

	/**
	 * Register generated galaxy when previous galaxy is filled with stars
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerGeneratedGalaxy(req, res, next) {
		try {
			logger.debug("registerGeneratedGalaxy START", {
				hasUser: !!req.user,
				hasUserToken: !!req.userToken,
				hasBody: !!req.body,
				bodyKeys: req.body ? Object.keys(req.body) : [],
			});

			const userId = req.user.id;
			const { galaxyData, sourceGalaxySeed } = req.body;

			logger.debug("registerGeneratedGalaxy request", {
				userId,
				galaxyData,
				sourceGalaxySeed,
			});

			// Validate required fields
			if (!galaxyData) {
				throw ApiError.BadRequest(
					"galaxyData is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate galaxy data structure
			if (!galaxyData.seed) {
				throw ApiError.BadRequest(
					"Galaxy seed is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			logger.debug("registerGeneratedGalaxy - calling gameService", {
				userId,
				galaxyDataSeed: galaxyData.seed,
				sourceGalaxySeed,
			});

			const result = await gameService.registerGeneratedGalaxy(
				userId,
				galaxyData,
				null, // transaction
				sourceGalaxySeed
			);

			// Логируем результат для отладки
			logger.debug("registerGeneratedGalaxy result:", {
				result,
				resultType: typeof result,
				hasResult: !!result,
				hasGalaxy: !!result?.galaxy,
				galaxyId: result?.galaxy?.id,
			});

			logger.info("Generated galaxy registered successfully", {
				userId,
				galaxySeed: galaxyData.seed,
				galaxyId: result?.galaxy?.id,
			});

			res.status(200).json({
				success: true,
				message: "Generated galaxy registered successfully",
				data: result.data,
			});
		} catch (error) {
			logger.error("Failed to register generated galaxy", {
				userId: req.initData?.id,
				error: error.message,
				galaxyData: req.body?.galaxyData,
			});
			next(error);
		}
	}

	/**
	 * Register captured galaxy with tgStars offer
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerCapturedGalaxy(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { galaxyData, offer } = req.body;

			logger.debug("registerCapturedGalaxy request", {
				userId,
				galaxyData,
				offer,
			});

			// Validate required fields
			if (!galaxyData) {
				throw ApiError.BadRequest(
					"galaxyData is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (!offer) {
				throw ApiError.BadRequest(
					"offer is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate galaxy data structure
			if (!galaxyData.seed) {
				throw ApiError.BadRequest(
					"Galaxy seed is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate offer structure
			if (!offer.price || !offer.currency) {
				throw ApiError.BadRequest(
					"Offer must have price and currency",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate price is non-negative (0 is allowed for mock payments)
			if (offer.price < 0) {
				throw ApiError.BadRequest(
					"Price must be non-negative",
					ERROR_CODES.VALIDATION.INVALID_AMOUNT
				);
			}

			const result = await gameService.registerCapturedGalaxy(
				userId,
				galaxyData,
				offer
			);

			logger.info("Captured galaxy registered successfully", {
				userId,
				galaxySeed: galaxyData.seed,
				price: offer.price,
				currency: offer.currency,
				galaxyId: result.data?.galaxy?.id,
			});

			res.status(200).json({
				success: true,
				message: "Captured galaxy registered successfully",
				data: result.data,
			});
		} catch (error) {
			logger.error("Failed to register captured galaxy", {
				userId: req.user?.id,
				error: error.message,
				galaxyData: req.body?.galaxyData,
				offer: req.body?.offer,
			});
			next(error);
		}
	}

	/**
	 * Complete payment from Telegram webhook
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async completePayment(req, res, next) {
		try {
			const { payment, payload, user } = req.body;

			logger.info("🔐 Payment completion request received from webhook", {
				paymentId: payment?.telegram_payment_charge_id,
				amount: payment?.total_amount,
				currency: payment?.currency,
				payload,
				userId: user?.id,
				userAgent: req.get("User-Agent"),
				ip: req.ip,
			});

			// Validate required fields
			if (!payment || !payload) {
				throw ApiError.BadRequest(
					"Payment and payload are required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Validate payment data
			if (!payment.telegram_payment_charge_id || !payment.total_amount) {
				throw ApiError.BadRequest(
					"Invalid payment data",
					ERROR_CODES.VALIDATION.INVALID_PAYMENT_DATA
				);
			}

			// Validate payload
			if (!payload.type || !payload.price) {
				throw ApiError.BadRequest(
					"Invalid payload data",
					ERROR_CODES.VALIDATION.INVALID_PAYLOAD_DATA
				);
			}

			// Process payment based on type
			let result;
			switch (payload.type) {
				case "galaxyCapture":
					// Handle galaxy capture payment
					result = await gameService.completeGalaxyCapturePayment(
						user?.id,
						payload,
						payment
					);
					break;
				case "stardust":
					// Handle stardust purchase payment
					result = await gameService.completeStardustPayment(
						user?.id,
						payload,
						payment
					);
					break;
				case "darkMatter":
					// Handle dark matter purchase payment
					result = await gameService.completeDarkMatterPayment(
						user?.id,
						payload,
						payment
					);
					break;
				case "galaxyUpgrade":
					// Handle galaxy upgrade payment
					result = await gameService.completeGalaxyUpgradePayment(
						user?.id,
						payload,
						payment
					);
					break;
				default:
					throw ApiError.BadRequest(
						`Unsupported payment type: ${payload.type}`,
						ERROR_CODES.VALIDATION.UNSUPPORTED_PAYMENT_TYPE
					);
			}

			logger.info("Payment completed successfully", {
				paymentId: payment.telegram_payment_charge_id,
				type: payload.type,
				userId: user?.id,
				result,
			});

			res.status(200).json({
				success: true,
				message: "Payment completed successfully",
				data: result,
			});
		} catch (error) {
			logger.error("Failed to complete payment", {
				payment: req.body?.payment,
				payload: req.body?.payload,
				error: error.message,
			});
			next(error);
		}
	}

	/**
	 * Send collection notification to user via Telegram bot
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async sendCollectionNotification(req, res, next) {
		try {
			const { userId, stardustAmount, darkMatterAmount, language } = req.body;

			// Validate required fields
			if (!userId) {
				throw ApiError.BadRequest(
					"User ID is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Determine message language (default: English)
			const userLanguage = language || "en";

			// Build message text based on language and resource amounts
			let messageText = "";
			let buttonText = "";

			if (userLanguage === "ru") {
				// Russian version
				messageText = "🌟 Ваше хранилище ресурсов заполнено и готово к сбору!";

				if (stardustAmount && stardustAmount > 0) {
					messageText += `\n\n✨ Звездная пыль: ${stardustAmount.toLocaleString("ru-RU")}`;
				}

				if (darkMatterAmount && darkMatterAmount > 0) {
					messageText += `\n\n🌑 Темная материя: ${darkMatterAmount.toLocaleString("ru-RU")}`;
				}

				messageText += "\n\nЗайдите в игру, чтобы собрать ваши ресурсы!";
				buttonText = "🪐 Открыть игру";
			} else {
				// English version
				messageText = "🌟 Your resource storage is full and ready to collect!";

				if (stardustAmount && stardustAmount > 0) {
					messageText += `\n\n✨ Stardust: ${stardustAmount.toLocaleString("en-US")}`;
				}

				if (darkMatterAmount && darkMatterAmount > 0) {
					messageText += `\n\n🌑 Dark Matter: ${darkMatterAmount.toLocaleString("en-US")}`;
				}

				messageText += "\n\nOpen the game to collect your resources!";
				buttonText = "🪐 Open Game";
			}

			// Get bot token and bot username from environment
			const botToken = process.env.BOT_TOKEN;
			if (!botToken) {
				throw ApiError.InternalServerError(
					"Bot token not configured",
					ERROR_CODES.SYSTEM.CONFIGURATION_ERROR
				);
			}

			// Get bot username from environment or use default
			const botUsername = process.env.BOT_USERNAME || "nebulahunt_bot";
			const myAppName = process.env.MINI_APP_NAME || "nebulahunt";
			const webAppUrl = `https://t.me/${botUsername}/${myAppName}`;

			// Send message via Telegram Bot API
			const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
			const response = await axios.post(telegramApiUrl, {
				chat_id: userId,
				text: messageText,
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: buttonText,
								url: webAppUrl,
							},
						],
					],
				},
			});

			logger.info("Collection notification sent successfully", {
				userId,
				language: userLanguage,
				messageId: response.data?.result?.message_id,
			});

			res.status(200).json({
				success: true,
				message: "Notification sent successfully",
			});
		} catch (error) {
			logger.error("Failed to send collection notification", {
				userId: req.body?.userId,
				error: error.message,
				response: error.response?.data,
			});
			next(error);
		}
	}

	/**
	 * Create Telegram invoice for payment
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async createInvoice(req, res, next) {
		try {
			const { title, description, price, payload, currency = "XTR" } = req.body;
			const userId = req.initdata?.id;

			// Validate required fields
			if (!title || !description || !price || price <= 0) {
				throw ApiError.BadRequest(
					"Title, description, and valid price are required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (!userId) {
				throw ApiError.Unauthorized(
					"User not authenticated",
					ERROR_CODES.AUTH.UNAUTHORIZED
				);
			}

			// Get bot token
			const botToken = process.env.BOT_TOKEN;
			if (!botToken) {
				throw ApiError.InternalServerError(
					"Bot token not configured",
					ERROR_CODES.SYSTEM.CONFIGURATION_ERROR
				);
			}

			// Prepare invoice payload
			const invoicePayload = payload || JSON.stringify({
				userId,
				title,
				description,
				price,
				timestamp: Date.now(),
			});

			// Create invoice via Telegram Bot API
			const telegramApiUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;
			const response = await axios.post(telegramApiUrl, {
				title: title,
				description: description,
				payload: invoicePayload,
				currency: currency, // XTR for Telegram Stars
				prices: [
					{
						label: title,
						amount: Math.round(price), // For Stars, amount is in Stars (not multiplied by 100)
					},
				],
			});

			if (!response.data?.ok || !response.data?.result) {
				throw ApiError.InternalServerError(
					"Failed to create invoice",
					ERROR_CODES.SYSTEM.EXTERNAL_API_ERROR
				);
			}

			logger.info("Invoice created successfully", {
				userId,
				title,
				price,
				invoiceUrl: response.data.result,
			});

			res.status(200).json({
				success: true,
				invoiceLink: response.data.result,
			});
		} catch (error) {
			logger.error("Failed to create invoice", {
				userId: req.initdata?.id,
				error: error.message,
				response: error.response?.data,
			});
			next(error);
		}
	}
}

module.exports = new GameController();
