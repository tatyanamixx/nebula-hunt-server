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
	 * Get galaxy preview with deterministic visual properties
	 * GET /api/game/preview-galaxy/:seed
	 */
	async previewGalaxy(req, res, next) {
		try {
			const { seed } = req.params;

			if (!seed) {
				throw ApiError.BadRequest("Galaxy seed is required");
			}

			// Генерируем детерминированные визуальные свойства на основе seed
			const {
				generateStarCountForCapture,
				generateGalaxyTypeFromSeed,
				generateColorPaletteFromSeed,
				generateBackgroundFromSeed,
				getGalaxyNameFromSeed,
			} = require("../utils/galaxy-utils");

			const starCount = generateStarCountForCapture(seed);

			// Расчёт цены захвата: Base pricing: 99 Stars per 10,000 stars, multiplied by 10 for galaxy capture
			const capturePrice = Math.ceil((starCount / 10000) * 99 * 10);

			const galaxyPreview = {
				seed,
				name: getGalaxyNameFromSeed(seed),
				type: generateGalaxyTypeFromSeed(seed),
				colorPalette: generateColorPaletteFromSeed(seed),
				background: generateBackgroundFromSeed(seed),
				starCount: starCount,
				capturePrice: capturePrice, // ✅ Добавляем цену захвата
			};

			logger.info("Galaxy preview generated", { seed, galaxyPreview });

			return res.json({
				success: true,
				data: galaxyPreview,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Register farming reward
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async registerFarmingReward(req, res, next) {
		try {
			const { galaxyData, offerData } = req.body;

			logger.debug("registerFarmingReward request", {
				galaxyData,
				offerData,
				fullBody: req.body,
			});

			// ✅ Обратная совместимость: если пришел старый формат с offerData, игнорируем его
			// и требуем galaxyData (новый формат)
			if (offerData) {
				logger.warn(
					"⚠️ Old format detected (offerData), ignoring. Please update client to use galaxyData format.",
					{
						userId: req.user.id,
						offerData,
						hasGalaxyData: !!galaxyData,
						requestBody: req.body,
					}
				);
			}

			// Validate required fields
			if (!galaxyData || !galaxyData.seed) {
				// ✅ Если есть offerData, но нет galaxyData, пытаемся получить seed из домашней галактики пользователя
				// Это временная мера для обратной совместимости со старым клиентом
				if (offerData) {
					logger.warn(
						"⚠️ Old format detected (offerData without galaxyData), trying to get seed from user's home galaxy",
						{ userId: req.user.id, offerData }
					);

					try {
						// Получаем домашнюю галактику пользователя
						const { Galaxy } = require("../models/models");
						const homeGalaxy = await Galaxy.findOne({
							where: {
								userId: req.user.id,
								isHome: true,
							},
							order: [["createdAt", "ASC"]], // Первая созданная галактика
						});

						if (homeGalaxy) {
							logger.warn("⚠️ Using home galaxy seed as fallback", {
								userId: req.user.id,
								seed: homeGalaxy.seed,
							});
							// Создаем galaxyData из домашней галактики
							const fallbackGalaxyData = { seed: homeGalaxy.seed };
							const result = await gameService.registerFarmingReward(
								req.user.id,
								fallbackGalaxyData
							);
							return res.status(200).json({
								success: true,
								data: result,
							});
						} else {
							// Если нет домашней галактики, берем первую галактику пользователя
							const firstGalaxy = await Galaxy.findOne({
								where: { userId: req.user.id },
								order: [["createdAt", "ASC"]],
							});

							if (firstGalaxy) {
								logger.warn(
									"⚠️ Using first galaxy seed as fallback",
									{ userId: req.user.id, seed: firstGalaxy.seed }
								);
								const fallbackGalaxyData = {
									seed: firstGalaxy.seed,
								};
								const result =
									await gameService.registerFarmingReward(
										req.user.id,
										fallbackGalaxyData
									);
								return res.status(200).json({
									success: true,
									data: result,
								});
							}
						}
					} catch (error) {
						logger.error("Failed to get fallback galaxy seed", {
							userId: req.user.id,
							error: error.message,
						});
					}
				}

				throw ApiError.BadRequest(
					"galaxyData with seed is required. Old format with offerData is no longer supported. Please update your client.",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Server now calculates resources based on lastCollectTime from DB
			const result = await gameService.registerFarmingReward(
				req.user.id,
				galaxyData
			);

			logger.info("Farming reward registered successfully", {
				userId: req.user.id,
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
		// Дополнительное логирование в консоль для отладки
		console.log("🔐 [COMPLETE PAYMENT] Request received:", {
			body: req.body,
			headers: req.headers,
			ip: req.ip,
		});

		try {
			const { payment, payload, user } = req.body;

			console.log("🔐 [COMPLETE PAYMENT] Parsed data:", {
				payment: payment ? "present" : "missing",
				payload: payload ? "present" : "missing",
				user: user ? "present" : "missing",
				userId: user?.id,
				paymentType: payload?.t || payload?.type,
			});

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
			if (!payment || !payload || !user || !user.id) {
				throw ApiError.BadRequest(
					"Payment, payload, and user are required",
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
			// Payload использует сокращенные имена: t=type, p=price
			const paymentType = payload.t || payload.type;
			const paymentPrice = payload.p || payload.price;
			if (!paymentType || !paymentPrice) {
				throw ApiError.BadRequest(
					"Invalid payload data: type and price are required",
					ERROR_CODES.VALIDATION.INVALID_PAYLOAD_DATA
				);
			}

			// Преобразуем userId в BigInt для консистентности
			const userId = BigInt(user.id);

			// Process payment based on type
			// Payload использует сокращенные имена: t=type, s=slug
			let result;
			switch (paymentType) {
				case "galaxyCapture":
					// Handle galaxy capture payment
					result = await gameService.completeGalaxyCapturePayment(
						userId,
						payload,
						payment
					);
					break;
				case "stardust":
					// ✅ Для пакетов используем usePackage, для прямых покупок - старую логику
					// Проверяем наличие slug (сокращенное имя s или полное packageSlug)
					if (payload.s || payload.packageSlug) {
						result = await gameService.completePackagePayment(
							userId,
							payload,
							payment
						);
					} else {
						// Handle stardust purchase payment (legacy)
						result = await gameService.completeStardustPayment(
							userId,
							payload,
							payment
						);
					}
					break;
				case "darkMatter":
					// ✅ Для пакетов используем usePackage, для прямых покупок - старую логику
					// Проверяем наличие slug (сокращенное имя s или полное packageSlug)
					if (payload.s || payload.packageSlug) {
						result = await gameService.completePackagePayment(
							userId,
							payload,
							payment
						);
					} else {
						// Handle dark matter purchase payment (legacy)
						result = await gameService.completeDarkMatterPayment(
							userId,
							payload,
							payment
						);
					}
					break;
				case "package":
					// ✅ Handle package payment
					result = await gameService.completePackagePayment(
						userId,
						payload,
						payment
					);
					break;
				case "galaxyUpgrade":
					// Handle galaxy upgrade payment
					result = await gameService.completeGalaxyUpgradePayment(
						userId,
						payload,
						payment
					);
					break;
				default:
					throw ApiError.BadRequest(
						`Unsupported payment type: ${paymentType}`,
						ERROR_CODES.VALIDATION.UNSUPPORTED_PAYMENT_TYPE
					);
			}

			logger.info("Payment completed successfully", {
				paymentId: payment.telegram_payment_charge_id,
				type: paymentType,
				userId: userId.toString(),
				result,
			});

			res.status(200).json({
				success: true,
				message: "Payment completed successfully",
				data: result,
			});
		} catch (error) {
			// Дополнительное логирование в консоль для отладки
			console.error("❌ [COMPLETE PAYMENT] Error:", {
				message: error.message,
				stack: error.stack,
				name: error.name,
				body: req.body,
			});

			logger.error("Failed to complete payment", {
				payment: req.body?.payment,
				payload: req.body?.payload,
				error: error.message,
				stack: error.stack,
				errorName: error.name,
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
				messageText =
					"🌟 Ваше хранилище ресурсов заполнено и готово к сбору!";

				if (stardustAmount && stardustAmount > 0) {
					messageText += `\n\n✨ Звездная пыль: ${stardustAmount.toLocaleString(
						"ru-RU"
					)}`;
				}

				if (darkMatterAmount && darkMatterAmount > 0) {
					messageText += `\n\n🌑 Темная материя: ${darkMatterAmount.toLocaleString(
						"ru-RU"
					)}`;
				}

				messageText += "\n\nЗайдите в игру, чтобы собрать ваши ресурсы!";
				buttonText = "🪐 Открыть игру";
			} else {
				// English version
				messageText =
					"🌟 Your resource storage is full and ready to collect!";

				if (stardustAmount && stardustAmount > 0) {
					messageText += `\n\n✨ Stardust: ${stardustAmount.toLocaleString(
						"en-US"
					)}`;
				}

				if (darkMatterAmount && darkMatterAmount > 0) {
					messageText += `\n\n🌑 Dark Matter: ${darkMatterAmount.toLocaleString(
						"en-US"
					)}`;
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
			const {
				title,
				description,
				price,
				payload,
				currency = "XTR",
			} = req.body;
			// ✅ Используем req.user.id после authMiddleware, fallback на req.initdata?.id
			const userId = req.user?.id || req.initdata?.id;

			// Validate required fields
			if (!title || !description || !price || price <= 0) {
				throw ApiError.BadRequest(
					"Title, description, and valid price are required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			if (!userId) {
				logger.error("createInvoice: User not authenticated", {
					hasUser: !!req.user,
					hasInitData: !!req.initdata,
					userIdFromUser: req.user?.id,
					userIdFromInitData: req.initdata?.id,
				});
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
			// Telegram ограничивает payload до 128 байт, поэтому используем минимальные данные
			let invoicePayload = payload;
			if (!invoicePayload) {
				// Создаем минимальный payload только с userId и timestamp
				const minimalPayload = {
					u: userId, // сокращенное имя для экономии места
					t: Date.now(), // timestamp
				};
				invoicePayload = JSON.stringify(minimalPayload);
			}

			// Проверяем длину payload (Telegram ограничивает до 128 байт)
			if (invoicePayload.length > 128) {
				logger.warn("Invoice payload too long, truncating", {
					userId,
					originalLength: invoicePayload.length,
				});
				// Обрезаем payload до 128 байт
				invoicePayload = invoicePayload.substring(0, 128);
			}

			// Проверяем тестовый режим платежей
			// Если включен, цена в инвойсе будет 1 звезда, но в payload останется реальная цена
			const testPaymentMode = global.testPaymentMode || false;
			const invoicePrice = testPaymentMode ? 1 : Math.round(price);

			if (testPaymentMode) {
				logger.info("Test payment mode enabled - using 1 star price", {
					userId,
					originalPrice: price,
					invoicePrice: 1,
				});
			}

			// Create invoice via Telegram Bot API
			const telegramApiUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

			const invoiceData = {
				title: title,
				description: description,
				payload: invoicePayload,
				currency: currency, // XTR for Telegram Stars
				prices: [
					{
						label: title,
						amount: invoicePrice, // For Stars, amount is in Stars (not multiplied by 100)
					},
				],
			};

			logger.debug("Creating Telegram invoice", {
				userId,
				title,
				price,
				currency,
				payloadLength: invoicePayload.length,
			});

			let response;
			try {
				response = await axios.post(telegramApiUrl, invoiceData);
			} catch (axiosError) {
				logger.error("Telegram Bot API error", {
					userId,
					status: axiosError.response?.status,
					statusText: axiosError.response?.statusText,
					data: axiosError.response?.data,
					message: axiosError.message,
				});
				throw ApiError.InternalServerError(
					`Failed to create invoice: ${
						axiosError.response?.data?.description || axiosError.message
					}`,
					ERROR_CODES.SYSTEM.EXTERNAL_API_ERROR
				);
			}

			if (!response.data?.ok || !response.data?.result) {
				logger.error("Telegram Bot API returned error", {
					userId,
					responseData: response.data,
				});
				throw ApiError.InternalServerError(
					`Failed to create invoice: ${
						response.data?.description || "Unknown error"
					}`,
					ERROR_CODES.SYSTEM.EXTERNAL_API_ERROR
				);
			}

			logger.info("Invoice created successfully", {
				userId,
				title,
				price: testPaymentMode ? `1 (test mode, original: ${price})` : price,
				invoiceUrl: response.data.result,
				testPaymentMode,
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
