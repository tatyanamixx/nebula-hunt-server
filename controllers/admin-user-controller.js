/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 * updated by Claude on 26.07.2025
 */
const adminUserService = require('../service/admin-user-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class AdminUserController {
	async getUsers(req, res, next) {
		try {
			logger.info('🔍 Getting all users...');
			const users = await adminUserService.getAllUsers();
			logger.info(`🔍 Found ${users.length} users`);

			return res.json({
				success: true,
				data: users,
				count: users.length,
			});
		} catch (e) {
			logger.error('❌ Error getting users:', e);
			next(e);
		}
	}

	async getUserById(req, res, next) {
		try {
			const { userId } = req.params;
			logger.info(`🔍 Getting user by ID: ${userId}`);

			const user = await adminUserService.getUserById(userId);

			return res.json({
				success: true,
				data: user,
			});
		} catch (e) {
			logger.error('❌ Error getting user by ID:', e);
			next(e);
		}
	}

	async blockUser(req, res, next) {
		try {
			const { userId } = req.params;
			logger.info(`🔒 Blocking user: ${userId}`);

			const user = await adminUserService.blockUser(userId);

			return res.json({
				success: true,
				message: 'User blocked successfully',
				data: user,
			});
		} catch (e) {
			logger.error('❌ Error blocking user:', e);
			next(e);
		}
	}

	async unblockUser(req, res, next) {
		try {
			const { userId } = req.params;
			logger.info(`🔓 Unblocking user: ${userId}`);

			const user = await adminUserService.unblockUser(userId);

			return res.json({
				success: true,
				message: 'User unblocked successfully',
				data: user,
			});
		} catch (e) {
			logger.error('❌ Error unblocking user:', e);
			next(e);
		}
	}

	async toggleUserBlock(req, res, next) {
		try {
			const { userId } = req.params;
			const { blocked } = req.body;

			if (typeof blocked !== 'boolean') {
				throw ApiError.BadRequest('blocked field must be a boolean');
			}

			logger.info(
				`🔄 Toggling user block: ${userId}, blocked: ${blocked}`
			);

			const user = await adminUserService.toggleUserBlock(
				userId,
				blocked
			);

			return res.json({
				success: true,
				message: `User ${
					blocked ? 'blocked' : 'unblocked'
				} successfully`,
				data: user,
			});
		} catch (e) {
			logger.error('❌ Error toggling user block:', e);
			next(e);
		}
	}

	async updateUserRole(req, res, next) {
		try {
			const { userId } = req.params;
			const { role } = req.body;

			if (!role || !['USER', 'SYSTEM'].includes(role)) {
				throw ApiError.BadRequest('role field must be USER or SYSTEM');
			}

			logger.info(`🔄 Updating user role: ${userId}, role: ${role}`);

			const user = await adminUserService.updateUserRole(userId, role);

			return res.json({
				success: true,
				message: 'User role updated successfully',
				data: user,
			});
		} catch (e) {
			logger.error('❌ Error updating user role:', e);
			next(e);
		}
	}

	async deleteUser(req, res, next) {
		try {
			const { userId } = req.params;
			logger.info(`🗑️ Deleting user: ${userId}`);

			const result = await adminUserService.deleteUser(userId);

			return res.json({
				success: true,
				message: 'User deleted successfully',
				data: result,
			});
		} catch (e) {
			logger.error('❌ Error deleting user:', e);
			next(e);
		}
	}

	async getUserStats(req, res, next) {
		try {
			logger.info('📊 Getting user statistics...');

			const stats = await adminUserService.getUserStats();

			return res.json({
				success: true,
				data: stats,
			});
		} catch (e) {
			logger.error('❌ Error getting user stats:', e);
			next(e);
		}
	}

	async giveCurrency(req, res, next) {
		try {
			const { userId } = req.params;
			const { currency, amount, reason } = req.body;
			const adminId = req.user?.id || null;

			// Преобразуем все значения в строки для логирования
			const adminIdStr = adminId ? String(adminId) : 'system';
			const userIdStr = String(userId);
			logger.info(
				`💰 Admin ${adminIdStr} giving ${amount} ${currency} to user ${userIdStr}...`
			);

			if (!currency || !amount) {
				throw ApiError.BadRequest('currency and amount are required');
			}

			// Преобразуем userId в число для сервиса (он сам обработает BigInt)
			const numericUserId = typeof userId === 'string' ? BigInt(userId) : userId;
			
			const result = await adminUserService.giveCurrency(
				numericUserId,
				currency,
				amount,
				reason || 'Admin grant',
				adminId
			);

			// Используем serializeBigInt для гарантированной сериализации ответа
			const { serializeBigInt } = require('../utils/serialization');
			const response = {
				success: true,
				message: `Successfully gave ${amount} ${currency} to user`,
				data: result,
			};

			return res.json(serializeBigInt(response));
		} catch (e) {
			// Сериализуем ошибку перед логированием, чтобы избежать проблем с BigInt
			const { serializeBigInt } = require('../utils/serialization');
			const errorMessage = e.message || 'Unknown error';
			const errorContext = serializeBigInt({
				userId: userIdStr,
				currency,
				amount,
				error: errorMessage,
				stack: e.stack || '',
			});
			logger.error(`❌ Error giving currency: ${errorMessage}`, errorContext);
			next(e);
		}
	}

	async getUserDetails(req, res, next) {
		try {
			const { userId } = req.params;
			logger.info(`🔍 Getting detailed info for user ${userId}...`);

			const details = await adminUserService.getUserDetails(userId);

			return res.json({
				success: true,
				data: details,
			});
		} catch (e) {
			logger.error('❌ Error getting user details:', e);
			next(e);
		}
	}

	async getUserTransactions(req, res, next) {
		try {
			const { userId } = req.params;
			const limit = parseInt(req.query.limit) || 100;
			const offset = parseInt(req.query.offset) || 0;

			logger.info(
				`🔍 Getting transactions for user ${userId} (limit: ${limit}, offset: ${offset})...`
			);

			const result = await adminUserService.getUserTransactions(
				userId,
				limit,
				offset
			);

			return res.json({
				success: true,
				data: result,
			});
		} catch (e) {
			logger.error('❌ Error getting user transactions:', e);
			next(e);
		}
	}

	async getAllTransactions(req, res, next) {
		try {
			const limit = parseInt(req.query.limit) || 100;
			const offset = parseInt(req.query.offset) || 0;

			logger.info(
				`🔍 Getting all transactions (limit: ${limit}, offset: ${offset})...`
			);

			const result = await adminUserService.getAllTransactions(limit, offset);

			return res.json({
				success: true,
				data: result,
			});
		} catch (e) {
			logger.error('❌ Error getting all transactions:', e);
			next(e);
		}
	}
}

module.exports = new AdminUserController();
