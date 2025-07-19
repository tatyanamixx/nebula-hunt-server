/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const adminUserService = require('../service/admin-user-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class AdminUserController {
	async getUsers(req, res, next) {
		try {
			const users = await adminUserService.getAllUsers();
			return res.json(users);
		} catch (e) {
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
}

module.exports = new AdminUserController();
