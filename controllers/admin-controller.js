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
			const { id } = req.params;
			const user = await adminService.blockUser(id);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}

	async unblockUser(req, res, next) {
		try {
			const { id } = req.params;
			const user = await adminService.unblockUser(id);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new AdminController();
