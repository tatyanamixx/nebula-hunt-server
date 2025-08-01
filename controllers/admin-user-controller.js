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
}

module.exports = new AdminUserController();
