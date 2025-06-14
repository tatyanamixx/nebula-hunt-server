const { User } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const galaxyService = require('./galaxy-service');
const userService = require('./user-service');
const sequelize = require('../db');

class AdminService {
	async getAllUsers() {
		const t = await sequelize.transaction();

		try {
			const users = await User.findAll({
				attributes: ['id', 'username', 'role', 'blocked', 'referral'],
				transaction: t,
			});

			await t.commit();
			return users;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get users: ${err.message}`);
		}
	}

	async blockUser(userId) {
		const t = await sequelize.transaction();

		try {
			const user = await User.findByPk(userId, { transaction: t });
			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			user.blocked = true;
			await user.save({ transaction: t });

			await t.commit();
			return user;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to block user: ${err.message}`);
		}
	}

	async unblockUser(userId) {
		const t = await sequelize.transaction();

		try {
			const user = await User.findByPk(userId, { transaction: t });
			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			user.blocked = false;
			await user.save({ transaction: t });

			await t.commit();
			return user;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to unblock user: ${err.message}`);
		}
	}
}

module.exports = new AdminService();
