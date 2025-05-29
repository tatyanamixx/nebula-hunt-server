const adminService = require('../service/admin-service');
const ApiError = require('../exceptions/api-error');

class AdminController {
	async getUsers(req, res, next) {
		try {
			const users = await adminService.getAllUsers();
			return res.json(users);
		} catch (e) {
			next(e);
		}
	}

	async blockUser(req, res, next) {
		try {
			const { userId } = req.params;
			const user = await adminService.blockUser(userId);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}

	async unblockUser(req, res, next) {
		try {
			const { userId } = req.params;
			const user = await adminService.unblockUser(userId);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new AdminController();
