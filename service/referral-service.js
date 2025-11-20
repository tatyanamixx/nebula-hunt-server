/**
 * Referral Service
 * Handles referral rewards for both referrer and referee
 */
const { User, UserState, PaymentTransaction } = require("../models/models");
const { SYSTEM_USER_ID } = require("../config/constants");
const marketService = require("./market-service");
const sequelize = require("../db");
const logger = require("./logger-service");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");
const axios = require("axios");

// Referral rewards configuration
const REFERRAL_REWARDS = {
	REFERRER: {
		// Reward for the person who invited (inviter)
		stardust: 5000,
		darkMatter: 10,
	},
	REFEREE: {
		// Reward for the person who was invited (new user)
		stardust: 5000,
		darkMatter: 10,
	},
};

class ReferralService {
	/**
	 * Process referral rewards for both referrer and referee
	 * @param {BigInt|string} referrerId - ID of the user who invited
	 * @param {BigInt|string} refereeId - ID of the new user who joined
	 * @param {Transaction} transaction - Optional transaction
	 * @returns {Promise<Object>} Result with rewards information
	 */
	async processReferral(referrerId, refereeId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			// Convert to BigInt for consistency
			const numericReferrerId = BigInt(referrerId);
			const numericRefereeId = BigInt(refereeId);

			console.log("🎯 === REFERRAL PROCESSING START ===");
			console.log(`📋 Referrer ID: ${numericReferrerId.toString()}`);
			console.log(`📋 Referee ID: ${numericRefereeId.toString()}`);
			
			logger.info("Processing referral rewards", {
				referrerId: numericReferrerId.toString(),
				refereeId: numericRefereeId.toString(),
			});

			// ✅ Проверка: уже обработан ли этот реферал?
			// Ищем PaymentTransaction с txType='REFEREE_REWARD' для этого referee
			const existingReward = await PaymentTransaction.findOne({
				where: {
					txType: "REFEREE_REWARD",
					toAccount: numericRefereeId, // Награда начислена referee
				},
				transaction: t,
			});

			if (existingReward) {
				console.log("⚠️ Referral already processed, skipping...");
				logger.warn("Referral rewards already processed", {
					referrerId: numericReferrerId.toString(),
					refereeId: numericRefereeId.toString(),
					existingTransactionId: existingReward.id,
				});
				
				if (shouldCommit) {
					await t.commit();
				}
				
				return {
					success: true,
					alreadyProcessed: true,
					message: "Referral rewards already processed",
				};
			}
			
			console.log("✅ First time processing this referral");

			// 1. Validate that referrer exists and is not the same as referee
			if (numericReferrerId === numericRefereeId) {
				throw ApiError.withCode(
					400,
					"Cannot use your own referral code",
					ERROR_CODES.VALIDATION.INVALID_REFERRAL
				);
			}

			// 2. Check if referrer exists
			const referrer = await User.findByPk(numericReferrerId, {
				transaction: t,
			});
			if (!referrer) {
				throw ApiError.withCode(
					404,
					"Referrer not found",
					ERROR_CODES.AUTH.USER_NOT_FOUND
				);
			}

			// 3. Check if referee exists
			const referee = await User.findByPk(numericRefereeId, {
				transaction: t,
			});
			if (!referee) {
				throw ApiError.withCode(
					404,
					"Referee not found",
					ERROR_CODES.AUTH.USER_NOT_FOUND
				);
			}

		// 4. Check if referee already has a referrer (prevent multiple referrals)
		// Разрешаем если referral уже установлен на того же реферера (из User.create)
		if (referee.referral && referee.referral !== 0 && BigInt(referee.referral) !== numericReferrerId) {
			throw ApiError.withCode(
				400,
				"User already has a different referrer",
				ERROR_CODES.VALIDATION.INVALID_REFERRAL
			);
		}

		// 5. Update referee's referral field (если еще не установлено)
		if (!referee.referral || referee.referral === 0 || referee.referral === "0") {
			referee.referral = numericReferrerId;
			await referee.save({ transaction: t });
			
			logger.debug("Updated referee's referral field", {
				refereeId: numericRefereeId.toString(),
				referrerId: numericReferrerId.toString(),
			});
		} else {
			logger.debug("Referee's referral field already set correctly", {
				refereeId: numericRefereeId.toString(),
				referrerId: numericReferrerId.toString(),
			});
		}

		// 6. Give reward to REFERRER (person who invited)
		console.log(`💰 Giving reward to REFERRER ${numericReferrerId.toString()}...`);
		const referrerReward = await this._giveReferralReward(
			numericReferrerId,
			REFERRAL_REWARDS.REFERRER,
			"REFERRER_REWARD",
			{
				refereeId: numericRefereeId.toString(),
				type: "referrer",
			},
			t
		);
		console.log(`✅ Referrer reward given: ${JSON.stringify(referrerReward)}`);

		// 7. Give reward to REFEREE (new user)
		console.log(`💰 Giving reward to REFEREE ${numericRefereeId.toString()}...`);
		const refereeReward = await this._giveReferralReward(
			numericRefereeId,
			REFERRAL_REWARDS.REFEREE,
			"REFEREE_REWARD",
			{
				referrerId: numericReferrerId.toString(),
				type: "referee",
			},
			t
		);
		console.log(`✅ Referee reward given: ${JSON.stringify(refereeReward)}`);

			if (shouldCommit) {
				await t.commit();
			}

			logger.info("Referral rewards processed successfully", {
				referrerId: numericReferrerId.toString(),
				refereeId: numericRefereeId.toString(),
				referrerReward,
				refereeReward,
			});

		// ✅ Отправляем уведомление реферу через бот
		console.log("🔔 === SENDING NOTIFICATION TO BOT ===");
		console.log(`📡 BOT_URL: ${process.env.BOT_URL || "NOT SET"}`);
		console.log(`👤 Referee ID: ${numericRefereeId.toString()}`);
		console.log(`👤 Referrer ID: ${numericReferrerId.toString()}`);
		
		logger.info("🔔 Attempting to send referral notification to bot", {
			refereeId: numericRefereeId.toString(),
			referrerId: numericReferrerId.toString(),
			botUrl: process.env.BOT_URL || "NOT SET",
		});
		
		this._sendReferralNotification(
			numericRefereeId,
			numericReferrerId,
			referee
		).catch((notifError) => {
			// Логируем ошибку, но не прерываем выполнение
			console.error("❌ NOTIFICATION FAILED:", notifError.message);
			console.error("Stack:", notifError.stack);
			logger.error("❌ Failed to send referral notification", {
				referrerId: numericReferrerId.toString(),
				refereeId: numericRefereeId.toString(),
				error: notifError.message,
				stack: notifError.stack,
				botUrl: process.env.BOT_URL || "NOT SET",
			});
		});

			return {
				success: true,
				referrerReward,
				refereeReward,
				message: "Referral rewards processed successfully",
			};
		} catch (error) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to process referral rewards", {
				referrerId,
				refereeId,
				error: error.message,
			});

			if (error instanceof ApiError) {
				throw error;
			}

			throw ApiError.withCode(
				500,
				`Failed to process referral: ${error.message}`,
				ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Give referral reward to a user
	 * @param {BigInt} userId - User ID
	 * @param {Object} rewards - Rewards to give {stardust, darkMatter}
	 * @param {string} txType - Transaction type
	 * @param {Object} metadata - Additional metadata
	 * @param {Transaction} transaction - Database transaction
	 * @returns {Promise<Object>} Reward details
	 * @private
	 */
	async _giveReferralReward(userId, rewards, txType, metadata, transaction) {
		const t = transaction;

		logger.debug("Giving referral reward", {
			userId: userId.toString(),
			rewards,
			txType,
			metadata,
		});

		// Give stardust
		if (rewards.stardust > 0) {
			const stardustOfferData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				itemType: "resource",
				itemId: 0,
				amount: rewards.stardust,
				resource: "stardust",
				price: 0,
				currency: "tonToken",
				offerType: "SYSTEM",
				txType: txType,
				status: "COMPLETED",
				metadata: {
					...metadata,
					resource: "stardust",
				},
			};

			await marketService.registerOffer(stardustOfferData, t);
		}

		// Give dark matter
		if (rewards.darkMatter > 0) {
			const darkMatterOfferData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				itemType: "resource",
				itemId: 0,
				amount: rewards.darkMatter,
				resource: "darkMatter",
				price: 0,
				currency: "tonToken",
				offerType: "SYSTEM",
				txType: txType,
				status: "COMPLETED",
				metadata: {
					...metadata,
					resource: "darkMatter",
				},
			};

			await marketService.registerOffer(darkMatterOfferData, t);
		}

		logger.debug("Referral reward given successfully", {
			userId: userId.toString(),
			rewards,
		});

		return rewards;
	}

	/**
	 * Get user's referrals count and list
	 * @param {BigInt|string} userId - User ID
	 * @returns {Promise<Object>} Referrals information
	 */
	async getUserReferrals(userId) {
		try {
			const numericUserId = BigInt(userId);

			// Get all users who have this user as their referrer
			const referrals = await User.findAll({
				where: { referral: numericUserId },
				attributes: ["id", "username", "createdAt"],
				include: [
					{
						model: UserState,
						attributes: ["stars", "stardust", "darkMatter"],
					},
				],
			});

			logger.debug("User referrals retrieved", {
				userId: numericUserId.toString(),
				count: referrals.length,
			});

			return {
				count: referrals.length,
				referrals: referrals.map((r) => r.toJSON()),
			};
		} catch (error) {
			logger.error("Failed to get user referrals", {
				userId,
				error: error.message,
			});

			throw ApiError.withCode(
				500,
				`Failed to get referrals: ${error.message}`,
				ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Send referral notification to referrer via Telegram bot
	 * @param {BigInt} refereeId - New user ID
	 * @param {BigInt} referrerId - Referrer user ID
	 * @param {Object} referee - Referee user object (to get language)
	 * @returns {Promise<void>}
	 * @private
	 */
	async _sendReferralNotification(refereeId, referrerId, referee) {
		try {
			console.log("📨 _sendReferralNotification called");
			
			// Получаем язык пользователя из БД (если есть)
			const referrerUser = await User.findByPk(referrerId);
			const language = referrerUser?.language || referee?.language || "en";
			console.log(`🌐 Language: ${language}`);

			const BOT_URL = process.env.BOT_URL || "http://localhost:3001";
			console.log(`🔗 Using BOT_URL: ${BOT_URL}`);

			const payload = {
				userId: refereeId.toString(),
				referrerId: referrerId.toString(),
				language: language,
			};
			console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

			logger.debug("Sending referral notification to bot", {
				refereeId: refereeId.toString(),
				referrerId: referrerId.toString(),
				language,
				botUrl: BOT_URL,
			});

			console.log(`🚀 Sending POST to ${BOT_URL}/api/process-referral...`);
			const response = await axios.post(
				`${BOT_URL}/api/process-referral`,
				payload,
				{
					timeout: 5000, // 5 секунд таймаут
				}
			);

			console.log(`✅ Response received:`, response.data);
			logger.info("Referral notification sent successfully", {
				refereeId: refereeId.toString(),
				referrerId: referrerId.toString(),
				response: response.data,
			});
		} catch (error) {
			// Не бросаем ошибку, просто логируем
			logger.warn("Failed to send referral notification to bot", {
				refereeId: refereeId.toString(),
				referrerId: referrerId.toString(),
				error: error.message,
				stack: error.stack,
			});
		}
	}
}

module.exports = new ReferralService();
