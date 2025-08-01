/**
 * created by Tatyana Mikhniukevich on 28.05.2025
 * updated by Claude on 26.07.2025
 */
const { User, UserState } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const logger = require('../service/logger-service');

class AdminUserService {
	async getAllUsers() {
		try {
			logger.info(
				'🔍 Executing getAllUsers query with UserState include...'
			);

			const users = await User.findAll({
				attributes: [
					'id',
					'username',
					'role',
					'blocked',
					'tonWallet',
					'referral',
					'createdAt',
					'updatedAt',
				],
				include: [
					{
						model: UserState,
						attributes: [
							'stardust',
							'darkMatter',
							'stars',
							'lockedStardust',
							'lockedDarkMatter',
							'lockedStars',
							'lastLoginDate',
							'currentStreak',
							'maxStreak',
							'chaosLevel',
							'stabilityLevel',
							'entropyVelocity',
						],
					},
				],
				order: [['createdAt', 'DESC']],
			});

			logger.info(`🔍 Query successful, found ${users.length} users`);

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
						? new Date(
								userData.userstate.lastLoginDate
						  ).toISOString()
						: null,
					// Remove the original userstate field to avoid confusion
					userstate: undefined,
				};
			});

			return plainUsers;
		} catch (err) {
			logger.error('❌ Database error in getAllUsers:', {
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
					'id',
					'username',
					'role',
					'blocked',
					'tonWallet',
					'referral',
					'createdAt',
					'updatedAt',
				],
				include: [
					{
						model: UserState,
						attributes: [
							'stardust',
							'darkMatter',
							'stars',
							'lockedStardust',
							'lockedDarkMatter',
							'lockedStars',
							'lastLoginDate',
							'currentStreak',
							'maxStreak',
							'chaosLevel',
							'stabilityLevel',
							'entropyVelocity',
						],
					},
				],
				transaction: t,
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
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
			logger.error('❌ Database error in getUserById:', err);
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
					'id',
					'username',
					'role',
					'blocked',
					'tonWallet',
					'referral',
					'createdAt',
					'updatedAt',
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
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
			logger.error('❌ Database error in blockUser:', err);
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
					'id',
					'username',
					'role',
					'blocked',
					'tonWallet',
					'referral',
					'createdAt',
					'updatedAt',
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
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
			logger.error('❌ Database error in unblockUser:', err);
			throw ApiError.Internal(`Failed to unblock user: ${err.message}`);
		}
	}

	async toggleUserBlock(userId, blocked) {
		const t = await sequelize.transaction();

		try {
			logger.info(
				`🔄 Toggling user ${userId} block status to ${blocked}...`
			);

			const user = await User.findByPk(userId, {
				transaction: t,
				attributes: [
					'id',
					'username',
					'role',
					'blocked',
					'tonWallet',
					'referral',
					'createdAt',
					'updatedAt',
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
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
			logger.error('❌ Database error in toggleUserBlock:', err);
			throw ApiError.Internal(
				`Failed to toggle user block: ${err.message}`
			);
		}
	}

	async updateUserRole(userId, role) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🔄 Updating user ${userId} role to ${role}...`);

			const user = await User.findByPk(userId, {
				transaction: t,
				attributes: [
					'id',
					'username',
					'role',
					'blocked',
					'tonWallet',
					'referral',
					'createdAt',
					'updatedAt',
				],
			});

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
			}

			// Validate role
			if (!['USER', 'SYSTEM'].includes(role)) {
				await t.rollback();
				throw ApiError.BadRequest(
					'Invalid role. Must be USER or SYSTEM'
				);
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
			logger.error('❌ Database error in updateUserRole:', err);
			throw ApiError.Internal(
				`Failed to update user role: ${err.message}`
			);
		}
	}

	async deleteUser(userId) {
		const t = await sequelize.transaction();

		try {
			logger.info(`🗑️ Deleting user ${userId}...`);

			const user = await User.findByPk(userId, { transaction: t });

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
			}

			// Delete associated UserState first (if exists)
			if (user.userState) {
				await user.userState.destroy({ transaction: t });
			}

			// Delete the user
			await user.destroy({ transaction: t });

			await t.commit();
			logger.info(`✅ User ${userId} deleted successfully`);

			return { success: true, message: 'User deleted successfully' };
		} catch (err) {
			await t.rollback();
			logger.error('❌ Database error in deleteUser:', err);
			throw ApiError.Internal(`Failed to delete user: ${err.message}`);
		}
	}

	async getUserStats() {
		try {
			logger.info('📊 Getting user statistics...');

			const stats = await User.findAll({
				attributes: [
					'role',
					'blocked',
					[sequelize.fn('COUNT', sequelize.col('id')), 'count'],
				],
				group: ['role', 'blocked'],
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
						stat.blocked ? 'BLOCKED' : 'ACTIVE'
					}`;
					acc[key] = parseInt(stat.count);
					return acc;
				}, {}),
			};

			logger.info('✅ User statistics retrieved successfully');
			return result;
		} catch (err) {
			logger.error('❌ Database error in getUserStats:', err);
			throw ApiError.Internal(`Failed to get user stats: ${err.message}`);
		}
	}
}

module.exports = new AdminUserService();
