/**
 * created by Tatyana Mikhniukevich on 08.05.2025
 */
const { UserState, User, Galaxy } = require("../models/models");
const logger = require("./logger-service");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");
const sequelize = require("../db");
const { Op } = require("sequelize");
const { LEADERBOARD_LIMIT, DAILY_BONUS_STARDUST } = require("../config/constants");
const { GAME_CONSTANTS } = require("../config/game-constants");

class UserStateService {
	async updateStreak(userState) {
		if (!userState) {
			logger.debug("updateStreak: userState is null, skipping streak update");
			return;
		}

		const now = new Date();
		// const today = new Date(
		// 	now.getFullYear(),
		// 	now.getMonth(),
		// 	now.getDate()
		// );

		const today = new Date(now);
		const lastLogin = userState.lastLoginDate
			? new Date(userState.lastLoginDate)
			: null;

		// If this is the first login ever
		if (!lastLogin) {
			userState.lastLoginDate = today;
			userState.currentStreak = 0; // Начинаем с 0, streak увеличится при выполнении первого задания
			userState.maxStreak = 0;
			userState.streakUpdatedAt = now;
			return;
		}

		// If already updated today, skip
		if (
			userState.streakUpdatedAt &&
			new Date(userState.streakUpdatedAt).toDateString() ===
				today.toDateString()
		) {
			return;
		}

		// Calculate the difference in hours
		const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

		if (diffDays === 1) {
			// Consecutive day - не увеличиваем здесь, streak увеличится при выполнении задания
			// Это просто обновление lastLoginDate
		} else if (diffDays > 1) {
			// Streak broken - сбрасываем на 0
			userState.currentStreak = 0;
		}

		userState.lastLoginDate = today;
		userState.streakUpdatedAt = now;
		userState.updatedAt = now;
	}

	async getUserState(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		try {
			logger.debug("getUserState on start", { userId });
			// Get basic user state
			let userState = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (userState) {
				// Update streak information
				await this.updateStreak(userState);
				await userState.save({ transaction: t });

				// ✅ Синхронизируем playerParameters с реальными уровнями из userUpgrades
				// ИСТОЧНИК ПРАВДЫ - userUpgrades, а не playerParameters!
				try {
					const upgradeService = require("./upgrade-service");
					// Вызываем getUserUpgrades, который синхронизирует playerParameters с userUpgrades
					await upgradeService.getUserUpgrades(userId);
					// Перезагружаем userState, чтобы получить обновленные playerParameters
					await userState.reload({ transaction: t });
					logger.debug(
						"Synced playerParameters with userUpgrades in getUserState",
						{
							userId,
						}
					);
				} catch (error) {
					logger.warn(
						"Failed to sync playerParameters with userUpgrades",
						{
							userId,
							error: error.message,
						}
					);
					// Не прерываем выполнение, так как это не критично
				}

				if (shouldCommit) {
					await t.commit();
				}

				logger.debug("getUserState completed successfully", { userId });
				return userState.toJSON();
			}
			if (shouldCommit) {
				await t.commit();
			}

			logger.debug("getUserState - user state not found", { userId });
			return userState;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}

			logger.error("Failed to get user state", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get user state: ${err.message}`,
				ERROR_CODES.USER_STATE.STATE_NOT_FOUND
			);
		}
	}

	async createUserState(userId, userState, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		try {
			// ✅ Конвертируем userId в число для базы данных
			const numericUserId = parseInt(userId, 10);

			logger.debug("createUserState on start", {
				userId,
				numericUserId,
				typeof: typeof userId,
				userState: userState,
			});
			await this.updateStreak(userState);
			logger.debug("createUserState", numericUserId, userState);

			// ✅ ЗАГРУЖАЕМ КОНСТАНТЫ ИЗ АДМИНКИ
			const freshConstants = require("../config/game-constants");

			// Create new state for new user (все ресурсы = 0, даем как подарок)
			const stateNew = await UserState.findOrCreate({
				where: { userId: numericUserId },
				defaults: {
					userId: numericUserId,
					stardust: 0, // ✅ Начинаем с 0, потом дадим как подарок
					darkMatter: 0, // ✅ Начинаем с 0, потом дадим как подарок
					stars: 0, // ✅ Начинаем с 0, потом дадим как подарок
					lockedStardust: userState.lockedStardust || 0,
					lockedDarkMatter: userState.lockedDarkMatter || 0,
					lockedStars: userState.lockedStars || 0,
					lastDailyBonus: userState.lastDailyBonus || null,
					lastLoginDate: userState.lastLoginDate || null,
					currentStreak: userState.currentStreak || 0,
					maxStreak: userState.maxStreak || 0,
					streakUpdatedAt: userState.streakUpdatedAt || null,
				},
				transaction: t,
			});

			// ✅ ПОДАРКИ ПОСЛЕ РЕГИСТРАЦИИ: Даем бонусные ресурсы как подарок
			if (stateNew[1]) {
				try {
					const marketService = require("./market-service");
					const { SYSTEM_USER_ID } = require("../config/constants");

					// ✅ ПОДАРОК 1: Stardust
					const stardustOfferData = {
						sellerId: SYSTEM_USER_ID,
						buyerId: numericUserId,
						itemType: "resource",
						itemId: 0,
						amount: freshConstants.ECONOMY.INITIAL_STARDUST,
						resource: "stardust",
						price: 0,
						currency: "tonToken",
						offerType: "SYSTEM",
						txType: "REGISTRATION_BONUS",
						status: "COMPLETED",
					};

					// ✅ ПОДАРОК 2: Dark Matter
					const darkMatterOfferData = {
						sellerId: SYSTEM_USER_ID,
						buyerId: numericUserId,
						itemType: "resource",
						itemId: 0,
						amount: freshConstants.ECONOMY.INITIAL_DARK_MATTER,
						resource: "darkMatter",
						price: 0,
						currency: "tonToken",
						offerType: "SYSTEM",
						txType: "REGISTRATION_BONUS",
						status: "COMPLETED",
					};

					// Создаем подарки через marketOffer (stars даются при создании галактики)
					await Promise.all([
						marketService.registerOffer(stardustOfferData, t),
						marketService.registerOffer(darkMatterOfferData, t),
					]);

					logger.info("🎁 Подарки регистрации созданы", {
						userId: numericUserId,
						stardust: freshConstants.ECONOMY.INITIAL_STARDUST,
						darkMatter: freshConstants.ECONOMY.INITIAL_DARK_MATTER,
					});
				} catch (giftErr) {
					logger.warn("⚠️ Не удалось создать подарки", {
						userId: numericUserId,
						error: giftErr.message,
					});
					// Не прерываем создание пользователя из-за ошибки подарков
				}
			}

			if (shouldCommit) {
				await t.commit();
			}

			logger.debug("createUserState completed successfully", { userId });
			return stateNew[0].toJSON();
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}

			logger.error("Failed to create user state", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to create/update user state: ${err.message}`,
				ERROR_CODES.USER_STATE.STATE_NOT_FOUND
			);
		}
	}

	async updateUserState(userId, userState, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			logger.debug("updateUserState on start", { userId });
			const stateData = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (stateData) {
				// Update basic state fields
				stateData.state = userState.state;
				stateData.chaosLevel =
					userState.chaosLevel !== undefined
						? userState.chaosLevel
						: stateData.chaosLevel;
				stateData.stabilityLevel =
					userState.stabilityLevel !== undefined
						? userState.stabilityLevel
						: stateData.stabilityLevel;
				stateData.entropyVelocity =
					userState.entropyVelocity !== undefined
						? userState.entropyVelocity
						: stateData.entropyVelocity;

				// Update currency fields
				// tgStars НЕ обновляем в реальном Telegram - баланс управляется Telegram'ом
				// Обновляем только в mock режиме для разработки
				if (
					userState.tgStars !== undefined &&
					process.env.NODE_ENV === "development"
				) {
					stateData.tgStars = BigInt(userState.tgStars);
					logger.debug("Mock mode: Updated tgStars in DB", {
						userId,
						newBalance: userState.tgStars,
					});
				}
				if (userState.stardust !== undefined) {
					stateData.stardust = BigInt(userState.stardust);
				}
				if (userState.darkMatter !== undefined) {
					stateData.darkMatter = BigInt(userState.darkMatter);
				}
				if (userState.stars !== undefined) {
					stateData.stars = BigInt(userState.stars);
				}
				// Ensure stateHistory is initialized
				if (!stateData.stateHistory) {
					stateData.stateHistory = [];
				}
				stateData.stateHistory.push({
					timestamp: new Date(),
					state: stateData.toJSON(),
				});

				// Update streak information
				await this.updateStreak(stateData);
				await stateData.save({ transaction: t });

				// Prepare response object
				const responseObj = {
					userId,
					userState: stateData.toJSON
						? stateData.toJSON()
						: { ...stateData },
				};

				if (shouldCommit) {
					await t.commit();
				}

				logger.debug(
					"updateUserState completed successfully - updated existing state",
					{ userId }
				);
				return responseObj;
			}

			// Create new state for new user
			const stateNew = await UserState.create(
				{
					userId: userId,
					state: userState.state,
					chaosLevel: userState.chaosLevel || 0.0,
					stabilityLevel: userState.stabilityLevel || 0.0,
					entropyVelocity: userState.entropyVelocity || 0.0,
					lastLoginDate: userState.lastLoginDate || null,
					currentStreak: userState.currentStreak || 0,
					maxStreak: userState.maxStreak || 0,
					streakUpdatedAt: userState.streakUpdatedAt || null,
					stateHistory: userState.stateHistory || [],
				},
				{ transaction: t }
			);

			await this.updateStreak(stateNew);

			stateNew.stateHistory.push({
				timestamp: new Date(),
				state: stateNew.toJSON(),
			});
			await stateNew.save({ transaction: t });
			if (shouldCommit) {
				await t.commit();
			}

			logger.debug(
				"updateUserState completed successfully - created new state",
				{ userId }
			);
			return { userId, userState: stateNew.toJSON() };
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}

			logger.error("Failed to update user state", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to update user state: ${err.message}`,
				ERROR_CODES.USER_STATE.STATE_NOT_FOUND
			);
		}
	}

	async leaderboard(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			logger.debug("leaderboard on start", { userId });
			// Get user data and position in the leaderboard
			let userRating = null;
			let userData = null;

			if (userId) {
				const userState = await UserState.findOne({
					where: { userId },
					include: {
						model: User,
						where: {
							role: {
								[Op.ne]: "SYSTEM",
							},
						},
					},
					attributes: [
						"stars",
						"stardust",
						"darkMatter",
						"currentStreak",
						"maxStreak",
						"updatedAt",
						"userId",
					],
					transaction: t,
				});

				if (userState) {
					const userStars = userState.stars || 0;
					const userUpdatedAt = userState.updatedAt;

					// Count users with more stars or same stars but more recent update
					// Exclude SYSTEM users from ranking
					const higherUsers = await UserState.count({
						where: {
							[Op.or]: [
								{
									stars: {
										[Op.gt]: userStars,
									},
								},
								{
									[Op.and]: [
										{
											stars: userStars,
										},
										{
											updatedAt: {
												[Op.gt]: userUpdatedAt,
											},
										},
									],
								},
							],
						},
						include: {
							model: User,
							where: {
								role: {
									[Op.ne]: "SYSTEM",
								},
							},
							attributes: [],
						},
						transaction: t,
					});

					userRating = higherUsers + 1;
					userData = userState.toJSON();
					userData.rating = userRating;
				}
			}

			// Get top users based on LEADERBOARD_LIMIT
			// Exclude SYSTEM users from leaderboard
			// Use subquery to get only the latest userstate for each user, then sort and limit
			const topUsers = await sequelize.query(
				`
				WITH latest_states AS (
					SELECT DISTINCT ON (us."userId") 
						us.stars,
						us.stardust,
						us."darkMatter",
						us."currentStreak",
						us."maxStreak",
						us."updatedAt",
						us."userId",
						u.username,
						(
							SELECT COUNT(*)::int
							FROM galaxies
							WHERE galaxies."userId" = us."userId"
						) as "galaxyCount"
					FROM userstates us
					INNER JOIN users u ON u.id = us."userId"
					WHERE u.role != 'SYSTEM'
					ORDER BY us."userId", us."updatedAt" DESC
				)
				SELECT * FROM latest_states
				ORDER BY stars DESC, "updatedAt" DESC
				LIMIT :limit
				`,
				{
					replacements: { limit: LEADERBOARD_LIMIT },
					type: sequelize.QueryTypes.SELECT,
					transaction: t,
				}
			);

			// Calculate ratings for top users
			const users = topUsers.map((item, index) => {
				// Raw query returns plain objects, not Sequelize instances
				const user =
					typeof item.toJSON === "function" ? item.toJSON() : item;
				user.rating = index + 1;
				// Add User object for consistency with client expectations
				if (user.username && !user.User) {
					user.User = {
						username: user.username,
					};
				}
				return user;
			});

			// Check if user is already in the leaderboard
			// Note: user.userId from raw query is a string, so use == instead of ===
			const userInLeaderboard =
				userId && users.some((user) => user.userId == userId);

			// Add user data to the end of the leaderboard if not already included
			if (userId && userData && !userInLeaderboard) {
				users.push(userData);
			}

			if (shouldCommit) {
				await t.commit();
			}

			logger.debug("leaderboard completed successfully", {
				userId,
				userRating,
				leaderboardSize: users.length,
			});
			return {
				leaderboard: users,
				userRating: userRating,
			};
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}

			logger.error("Failed to get leaderboard", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get leaderboard: ${err.message}`,
				ERROR_CODES.USER_STATE.STATE_NOT_FOUND
			);
		}
	}

	async getUserResources(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			logger.debug("getUserResources on start", { userId });
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				if (shouldCommit) {
					await t.rollback();
				}
				logger.debug("User state not found for resources", { userId });
				throw ApiError.NotFound(
					`User state not found: ${userId}`,
					ERROR_CODES.USER_STATE.STATE_NOT_FOUND
				);
			}

			// Extract resources from user state
			const resources = {
				stardust: userState.stardust || 0,
				darkMatter: userState.darkMatter || 0,
				stars: userState.stars || 0,
				tonToken: userState.tonToken || 0,
				lastDailyBonus: userState.lastDailyBonus || null,
				lockedResources: {
					stardust: userState.lockedStardust || 0,
					darkMatter: userState.lockedDarkMatter || 0,
					stars: userState.lockedStars || 0,
				},
				playerParameters: userState.playerParameters || {
					stardustProduction: 0,
					starDiscount: 0,
					darkMatterChance: 0,
					stardustMultiplier: 0,
					galaxyExplorer: 0,
					darkMatterSynthesis: 0,
					bulkCreation: 0,
					stellarMarket: 0,
					cosmicHarmony: 0,
					overflowProtection: 0,
					quantumInstability: 0,
					voidResonance: 0,
					stellarForge: 0,
				},
				lastBotNotification: userState.lastBotNotification || {
					lastBotNotificationTime: null,
					lastBotNotificationToday: {
						date: null,
						count: 0,
					},
				},
			};

			if (shouldCommit) {
				await t.commit();
			}

			logger.debug("getUserResources completed successfully", { userId });
			return resources;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}

			logger.error("Failed to get user resources", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to get user resources: ${err.message}`,
				ERROR_CODES.USER_STATE.STATE_NOT_FOUND
			);
		}
	}
}

module.exports = new UserStateService();
