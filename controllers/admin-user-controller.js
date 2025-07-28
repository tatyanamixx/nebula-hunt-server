/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const adminUserService = require('../service/admin-user-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class AdminUserController {
	async getUsers(req, res, next) {
		try {
			console.log('🔍 Getting all users...');
			const users = await adminUserService.getAllUsers();
			console.log(`🔍 Found ${users.length} users`);
			return res.json(users);
		} catch (e) {
			console.error('❌ Error getting users:', e);
			logger.error('Get users error', {
				error: e.message,
				stack: e.stack,
			});
			next(e);
		}
	}

	async blockUser(req, res, next) {
		try {
			const { userId } = req.params;
			const user = await adminUserService.blockUser(userId);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}

	async unblockUser(req, res, next) {
		try {
			const { userId } = req.params;
			const user = await adminUserService.unblockUser(userId);
			return res.json(user);
		} catch (e) {
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

			const user = await adminUserService.toggleUserBlock(
				userId,
				blocked
			);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new AdminUserController();
