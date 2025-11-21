/**
 * created by Tatyana Mikhniukevich on 28.05.2025
 * updated by Claude on 26.07.2025
 */
const { User, UserState, Galaxy, PaymentTransaction } = require("../models/models");
const ApiError = require("../exceptions/api-error");
const sequelize = require("../db");
const logger = require("../service/logger-service");
const userStateService = require("./user-state-service");
const { Op } = require("sequelize");
const { SYSTEM_USER_ID } = require("../config/constants");
const { serializeBigInt } = require("../utils/serialization");

class AdminUserService {
	async getAllUsers() {
		try {
			logger.info("🔍 Executing getAllUsers query with UserState include...");

			const users = await User.findAll({
				attributes: [
					"id",
					"username",
					"role",
					"blocked",
					"tonWallet",
					"referral",
					"createdAt",
					"updatedAt",
				],
				include: [
					{
						model: UserState,
						attributes: [
							"stardust",
							"darkMatter",
							"stars",
							"lockedStardust",
							"lockedDarkMatter",
							"lockedStars",
							"lastLoginDate",
							"currentStreak",
							"maxStreak",
							"chaosLevel",
							"stabilityLevel",
							"entropyVelocity",
						],
					},
				],
				order: [["createdAt", "DESC"]],
			});

			logger.info(`🔍 Query successful, found ${users.length} users`);

			// Get referrals count for each user
			// We'll do this in a separate query for better performance
			const userIds = users.map((u) => BigInt(u.id));

			// Используем count для каждого пользователя отдельно для надежности
			const referralsMap = {};
			await Promise.all(
				userIds.map(async (userId) => {
					const count = await User.count({
						where: { referral: userId },
					});
					referralsMap[userId.toString()] = count;
				})
			);

			// Convert Sequelize instances to plain objects for JSON response
			const plainUsers = users.map((user) => {
				const userData = user.get({ plain: true });
				return {
					...userData,
					// Convert Date objects to ISO strings for proper JSON serialization
					createdAt: userData.createdAt
						? new Date(userData.createdAt).toISOString()
						: null,
					updatedAt: userData.updatedAt
						? new Date(userData.updatedAt).toISOString()
						: null,
					// Map userstate to userState for frontend compatibility
					userState: userData.userstate || null,
					// Add lastLoginAt from UserState for convenience
					lastLoginAt: userData.userstate?.lastLoginDate
						? new Date(userData.userstate.lastLoginDate).toISOString()
						: null,
					// Add referrals count
					referralsCount: referralsMap[userData.id.toString()] || 0,
					// Remove the original userstate field to avoid confusion
					userstate: undefined,
				};
			});

			return plainUsers;
		} catch (err) {
			logger.error("❌ Database error in getAllUsers:", {
				message: err.message,
				stack: err.stack,
				type: err.constructor.name,
			});
			throw ApiError.Internal(`Failed to get users: ${err.message}`);
		}
	}

	async getUserById(userId) {
		const t = await sequelize.transaction();

		try {
			const user = await User.findByPk(userId, {
				attributes: [
					"id",
					"username",
					"role",
					"blocked",
					"tonWallet",
					"referral",
					"createdAt",
					"updatedAt",
				],
				include: [
					{
						model: UserState,
						attributes: [
							"stardust",
							"darkMatter",
							"stars",
							"lockedStardust",
							"lockedDarkMatter",
							"lockedStars",
							"lastLoginDate",
							"currentStreak",
							"maxStreak",
							"chaosLevel",
							"stabilityLevel",
							"entropyVelocity",
						],
					},
				],
				transaction: t,
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest("User not found");
			}

			await t.commit();
			const userData = user.get({ plain: true });
			return {
				...userData,
				// Convert Date objects to ISO strings for proper JSON serialization
				createdAt: userData.createdAt
					? new Date(userData.createdAt).toISOString()
					: null,
				updatedAt: userData.updatedAt
					? new Date(userData.updatedAt).toISOString()
					: null,
				// Map userstate to userState for frontend compatibility
				userState: userData.userstate || null,
				// Add lastLoginAt from UserState for convenience
				lastLoginAt: userData.userstate?.lastLoginDate
					? new Date(userData.userstate.lastLoginDate).toISOString()
					: null,
				// Remove the original userstate field to avoid confusion
				userstate: undefined,
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in getUserById:", err);
			throw ApiError.Internal(`Failed to get user: ${err.message}`);
		}
	}

	async blockUser(userId) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🔒 Blocking user ${userId}...`);

			const user = await User.findByPk(userId, {
				transaction: t,
				attributes: [
					"id",
					"username",
					"role",
					"blocked",
					"tonWallet",
					"referral",
					"createdAt",
					"updatedAt",
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest("User not found");
			}

			user.blocked = true;
			await user.save({ transaction: t });

			await t.commit();
			logger.info(`✅ User ${userId} blocked successfully`);

			const userData = user.get({ plain: true });
			return {
				...userData,
				// Convert Date objects to ISO strings for proper JSON serialization
				createdAt: userData.createdAt
					? new Date(userData.createdAt).toISOString()
					: null,
				updatedAt: userData.updatedAt
					? new Date(userData.updatedAt).toISOString()
					: null,
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in blockUser:", err);
			throw ApiError.Internal(`Failed to block user: ${err.message}`);
		}
	}

	async unblockUser(userId) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🔓 Unblocking user ${userId}...`);

			const user = await User.findByPk(userId, {
				transaction: t,
				attributes: [
					"id",
					"username",
					"role",
					"blocked",
					"tonWallet",
					"referral",
					"createdAt",
					"updatedAt",
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest("User not found");
			}

			user.blocked = false;
			await user.save({ transaction: t });

			await t.commit();
			logger.info(`✅ User ${userId} unblocked successfully`);

			const userData = user.get({ plain: true });
			return {
				...userData,
				// Convert Date objects to ISO strings for proper JSON serialization
				createdAt: userData.createdAt
					? new Date(userData.createdAt).toISOString()
					: null,
				updatedAt: userData.updatedAt
					? new Date(userData.updatedAt).toISOString()
					: null,
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in unblockUser:", err);
			throw ApiError.Internal(`Failed to unblock user: ${err.message}`);
		}
	}

	async toggleUserBlock(userId, blocked) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🔄 Toggling user ${userId} block status to ${blocked}...`);

			const user = await User.findByPk(userId, {
				transaction: t,
				attributes: [
					"id",
					"username",
					"role",
					"blocked",
					"tonWallet",
					"referral",
					"createdAt",
					"updatedAt",
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest("User not found");
			}

			user.blocked = blocked;
			await user.save({ transaction: t });

			await t.commit();
			logger.info(`✅ User ${userId} block status updated to ${blocked}`);

			const userData = user.get({ plain: true });
			return {
				...userData,
				// Convert Date objects to ISO strings for proper JSON serialization
				createdAt: userData.createdAt
					? new Date(userData.createdAt).toISOString()
					: null,
				updatedAt: userData.updatedAt
					? new Date(userData.updatedAt).toISOString()
					: null,
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in toggleUserBlock:", err);
			throw ApiError.Internal(`Failed to toggle user block: ${err.message}`);
		}
	}

	async updateUserRole(userId, role) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🔄 Updating user ${userId} role to ${role}...`);

			const user = await User.findByPk(userId, {
				transaction: t,
				attributes: [
					"id",
					"username",
					"role",
					"blocked",
					"tonWallet",
					"referral",
					"createdAt",
					"updatedAt",
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest("User not found");
			}

			// Validate role
			if (!["USER", "SYSTEM"].includes(role)) {
				await t.rollback();
				throw ApiError.BadRequest("Invalid role. Must be USER or SYSTEM");
			}

			user.role = role;
			await user.save({ transaction: t });

			await t.commit();
			logger.info(`✅ User ${userId} role updated to ${role}`);

			const userData = user.get({ plain: true });
			return {
				...userData,
				// Convert Date objects to ISO strings for proper JSON serialization
				createdAt: userData.createdAt
					? new Date(userData.createdAt).toISOString()
					: null,
				updatedAt: userData.updatedAt
					? new Date(userData.updatedAt).toISOString()
					: null,
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in updateUserRole:", err);
			throw ApiError.Internal(`Failed to update user role: ${err.message}`);
		}
	}

	async deleteUser(userId) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🗑️ Deleting user ${userId}...`);

			const user = await User.findByPk(userId, { transaction: t });

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest("User not found");
			}

			// Delete associated UserState first (if exists)
			if (user.userState) {
				await user.userState.destroy({ transaction: t });
			}

			// Delete the user
			await user.destroy({ transaction: t });

			await t.commit();
			logger.info(`✅ User ${userId} deleted successfully`);

			return { success: true, message: "User deleted successfully" };
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in deleteUser:", err);
			throw ApiError.Internal(`Failed to delete user: ${err.message}`);
		}
	}

	async getUserStats() {
		try {
			logger.info("📊 Getting user statistics...");

			const stats = await User.findAll({
				attributes: [
					"role",
					"blocked",
					[sequelize.fn("COUNT", sequelize.col("id")), "count"],
				],
				group: ["role", "blocked"],
				raw: true,
			});

			// Calculate totals
			const totalUsers = await User.count();
			const blockedUsers = await User.count({ where: { blocked: true } });
			const activeUsers = totalUsers - blockedUsers;

			const result = {
				total: totalUsers,
				active: activeUsers,
				blocked: blockedUsers,
				byRole: stats.reduce((acc, stat) => {
					const key = `${stat.role}_${
						stat.blocked ? "BLOCKED" : "ACTIVE"
					}`;
					acc[key] = parseInt(stat.count);
					return acc;
				}, {}),
			};

			logger.info("✅ User statistics retrieved successfully");
			return result;
		} catch (err) {
			logger.error("❌ Database error in getUserStats:", err);
			throw ApiError.Internal(`Failed to get user stats: ${err.message}`);
		}
	}

	async giveCurrency(
		userId,
		currency,
		amount,
		reason = "Admin grant",
		adminId = null
	) {
		const t = await sequelize.transaction();

		// Преобразуем userId в строку для логирования, чтобы избежать проблем с BigInt
		// Делаем это ДО try блока, чтобы использовать в catch
		const userIdStr =
			typeof userId === "bigint" ? userId.toString() : String(userId);

		// Сохраняем currency и amount для использования в catch
		const currencyStr = String(currency || "unknown");
		const amountNum =
			typeof amount === "bigint" ? Number(amount) : Number(amount || 0);

		try {
			logger.info(`💰 Giving ${amount} ${currency} to user ${userIdStr}...`);

			// Validate currency type
			const validCurrencies = ["stardust", "darkMatter", "stars"];
			if (!validCurrencies.includes(currency)) {
				await t.rollback();
				throw ApiError.BadRequest(
					`Invalid currency. Must be one of: ${validCurrencies.join(", ")}`
				);
			}

			// Validate amount
			if (amount <= 0 || !Number.isFinite(amount)) {
				await t.rollback();
				throw ApiError.BadRequest("Amount must be a positive number");
			}

			// Get user state
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				await t.rollback();
				throw ApiError.BadRequest("User state not found");
			}

			// Update currency
			const currentAmount = BigInt(userState[currency] || 0);
			const newAmount = currentAmount + BigInt(Math.floor(amount));
			userState[currency] = newAmount;
			await userState.save({ transaction: t });

			// Преобразуем userId в BigInt для транзакций
			const numericUserId =
				typeof userId === "bigint" ? userId : BigInt(userId);
			const numericSystemUserId =
				typeof SYSTEM_USER_ID === "bigint"
					? SYSTEM_USER_ID
					: BigInt(SYSTEM_USER_ID);

			// Создаем PaymentTransaction для учета через marketService.registerOffer
			// (как это делается для farming rewards)
			const marketService = require("./market-service");
			const systemOffer = {
				sellerId: numericSystemUserId,
				buyerId: numericUserId,
				txType: "RESOURCE_TRANSFER", // Используем существующий тип
				itemType: "resource",
				itemId: 0, // Для admin grants не нужен конкретный item
				price: 0,
				currency: "tonToken",
				amount: Math.floor(amount),
				resource: currency,
				offerType: "SYSTEM",
				metadata: {
					reason: String(reason || "Admin grant"),
					adminGrant: true,
					adminId: adminId ? String(adminId) : "system",
				},
			};

			// Используем marketService.registerOffer для создания транзакции
			await marketService.registerOffer(systemOffer, t);

			await t.commit();

			// Return all values as strings/numbers to avoid BigInt serialization issues
			// Используем serializeBigInt для гарантированной сериализации
			const result = {
				userId: userIdStr,
				currency,
				amount: Math.floor(amount),
				previousAmount: currentAmount.toString(),
				newAmount: newAmount.toString(),
			};

			// Сериализуем результат перед логированием
			const serializedResult = serializeBigInt(result);
			logger.info(
				`✅ Successfully gave ${amount} ${currency} to user ${userIdStr}`,
				{
					result: serializedResult,
				}
			);

			// Возвращаем сериализованный результат
			return serializedResult;
		} catch (err) {
			await t.rollback();

			// Безопасно извлекаем сообщение об ошибке, преобразуя все BigInt в строки
			let errorMessage = "Unknown error";
			try {
				errorMessage = String(
					err.message || err.toString() || "Unknown error"
				);
			} catch (e) {
				errorMessage = "Error serialization failed";
			}

			// Безопасно извлекаем стек, преобразуя все BigInt в строки
			let errorStack = "";
			try {
				errorStack = String(err.stack || "");
			} catch (e) {
				errorStack = "Stack serialization failed";
			}

			// Преобразуем все значения в строки для логирования, чтобы избежать проблем с BigInt

			// Сериализуем контекст перед логированием
			const errorContext = serializeBigInt({
				userId: userIdStr,
				currency: currencyStr,
				amount: String(amountNum),
				error: errorMessage,
				stack: errorStack,
			});

			// Безопасное логирование
			try {
				logger.error(
					`❌ Database error in giveCurrency: ${errorMessage}`,
					errorContext
				);
			} catch (logError) {
				// Если логирование тоже падает, просто выводим в консоль
				console.error("Failed to log error:", logError);
				console.error("Original error:", errorMessage);
			}

			if (err instanceof ApiError) {
				// Создаем новую ошибку с безопасным сообщением
				const safeError = ApiError.Internal(
					`Failed to give currency: ${errorMessage}`
				);
				throw safeError;
			}

			// Создаем новую ошибку с безопасным сообщением
			throw ApiError.Internal(`Failed to give currency: ${errorMessage}`);
		}
	}

	async getUserDetails(userId) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🔍 Getting detailed info for user ${userId}...`);

			// Get user with state
			const user = await User.findByPk(userId, {
				attributes: [
					"id",
					"username",
					"role",
					"blocked",
					"tonWallet",
					"referral",
					"createdAt",
					"updatedAt",
				],
				include: [
					{
						model: UserState,
						attributes: [
							"stardust",
							"darkMatter",
							"stars",
							"lockedStardust",
							"lockedDarkMatter",
							"lockedStars",
							"lastLoginDate",
							"currentStreak",
							"maxStreak",
						],
					},
				],
				transaction: t,
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest("User not found");
			}

			// Get galaxies
			const galaxies = await Galaxy.findAll({
				where: { userId },
				attributes: [
					"id",
					"seed",
					"name",
					"starCurrent",
					"maxStars",
					"birthDate",
					"lastCollectTime",
					"galaxyType",
					"colorPalette",
					"backgroundType",
					"createdAt",
				],
				order: [["starCurrent", "DESC"]],
				transaction: t,
			});

			// Calculate total stars from galaxies
			const totalStarsFromGalaxies = galaxies.reduce(
				(sum, galaxy) => sum + (galaxy.starCurrent || 0),
				0
			);

			// Get leaderboard position
			let leaderboardPosition = null;
			try {
				const leaderboardResult = await userStateService.leaderboard(
					userId,
					t
				);
				leaderboardPosition = leaderboardResult.userRating || null;
			} catch (err) {
				logger.warn("Failed to get leaderboard position:", err);
			}

			// Get referrals count (users who were invited by this user)
			const referralsCount = await User.count({
				where: { referral: userId },
				transaction: t,
			});

			await t.commit();

			const userData = user.get({ plain: true });

			// Convert BigInt values in userState to strings
			let userStateData = null;
			if (userData.userstate) {
				userStateData = {
					...userData.userstate,
					stardust: userData.userstate.stardust?.toString() || "0",
					darkMatter: userData.userstate.darkMatter?.toString() || "0",
					stars: userData.userstate.stars?.toString() || "0",
					lockedStardust:
						userData.userstate.lockedStardust?.toString() || "0",
					lockedDarkMatter:
						userData.userstate.lockedDarkMatter?.toString() || "0",
					lockedStars: userData.userstate.lockedStars?.toString() || "0",
				};
			}

			return {
				user: {
					...userData,
					createdAt: userData.createdAt
						? new Date(userData.createdAt).toISOString()
						: null,
					updatedAt: userData.updatedAt
						? new Date(userData.updatedAt).toISOString()
						: null,
					userState: userStateData,
					lastLoginAt: userData.userstate?.lastLoginDate
						? new Date(userData.userstate.lastLoginDate).toISOString()
						: null,
					userstate: undefined,
				},
				galaxies: galaxies.map((galaxy) => ({
					...galaxy.get({ plain: true }),
					starCurrent: galaxy.starCurrent || 0,
					maxStars: galaxy.maxStars || 100000,
				})),
				totalStarsFromGalaxies,
				leaderboardPosition,
				referralsCount,
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in getUserDetails:", err);
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to get user details: ${err.message}`);
		}
	}

	async getUserTransactions(userId, limit = 100, offset = 0) {
		const t = await sequelize.transaction();

		try {
			logger.info(
				`🔍 Getting transactions for user ${userId} (limit: ${limit}, offset: ${offset})...`
			);

			// Get transactions where user is either sender or receiver
			const transactions = await PaymentTransaction.findAndCountAll({
				where: {
					[Op.or]: [{ fromAccount: userId }, { toAccount: userId }],
				},
				order: [["createdAt", "DESC"]],
				limit: parseInt(limit),
				offset: parseInt(offset),
				transaction: t,
			});

			await t.commit();

			return {
				transactions: transactions.rows.map((tx) => ({
					...tx.get({ plain: true }),
					priceOrAmount: parseFloat(tx.priceOrAmount),
					createdAt: tx.createdAt
						? new Date(tx.createdAt).toISOString()
						: null,
					confirmedAt: tx.confirmedAt
						? new Date(tx.confirmedAt).toISOString()
						: null,
				})),
				total: transactions.count,
				limit: parseInt(limit),
				offset: parseInt(offset),
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in getUserTransactions:", err);
			throw ApiError.Internal(`Failed to get transactions: ${err.message}`);
		}
	}

	async getAllTransactions(limit = 100, offset = 0) {
		const t = await sequelize.transaction();

		try {
			logger.info(
				`🔍 Getting all transactions (limit: ${limit}, offset: ${offset})...`
			);

			const transactions = await PaymentTransaction.findAndCountAll({
				order: [["createdAt", "DESC"]],
				limit: parseInt(limit),
				offset: parseInt(offset),
				transaction: t,
			});

			await t.commit();

			return {
				transactions: transactions.rows.map((tx) => ({
					...tx.get({ plain: true }),
					priceOrAmount: parseFloat(tx.priceOrAmount),
					createdAt: tx.createdAt
						? new Date(tx.createdAt).toISOString()
						: null,
					confirmedAt: tx.confirmedAt
						? new Date(tx.confirmedAt).toISOString()
						: null,
				})),
				total: transactions.count,
				limit: parseInt(limit),
				offset: parseInt(offset),
			};
		} catch (err) {
			await t.rollback();
			logger.error("❌ Database error in getAllTransactions:", err);
			throw ApiError.Internal(`Failed to get transactions: ${err.message}`);
		}
	}
}

module.exports = new AdminUserService();
