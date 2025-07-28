/**
 * created by Tatyana Mikhniukevich on 28.05.2025
 */
const { User, UserState } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');

class AdminUserService {
	async getAllUsers() {
		try {
			console.log('🔍 Executing simple User.findAll query...');
			const users = await User.findAll({
				attributes: ['id', 'username', 'role', 'blocked'],
			});

			console.log(`🔍 Query successful, found ${users.length} users`);
			return users;
		} catch (err) {
			console.error('❌ Database error in getAllUsers:', err);
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

	async toggleUserBlock(userId, blocked) {
		const t = await sequelize.transaction();

		try {
			const user = await User.findByPk(userId, { transaction: t });
			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			user.blocked = blocked;
			await user.save({ transaction: t });

			await t.commit();
			return user;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to toggle user block: ${err.message}`
			);
		}
	}
}

module.exports = new AdminUserService();
