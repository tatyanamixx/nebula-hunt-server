/**
 * created by Tatyana Mikhniukevich on 08.05.2025
 */
const {
	UserState,
	User,
	UpgradeNode,
	UserUpgrade,
	UserTask,
	UserEvent,
	UserEventSetting,
} = require('../models/models');
const loggerService = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const upgradeService = require('./upgrade-service');
const taskService = require('./task-service');
const eventService = require('./event-service');
const sequelize = require('../db');
const { Op } = require('sequelize');
const { LEADERBOARD_LIMIT } = require('../config/constants');

class UserStateService {
	async updateStreak(userState) {
		const now = new Date();
		const today = new Date(now);

		const lastLogin = userState.lastLoginDate
			? new Date(userState.lastLoginDate)
			: null;

		// If this is the first login ever
		if (!lastLogin) {
			userState.lastLoginDate = today;
			userState.currentStreak = 1;
			userState.maxStreak = 1;
			userState.streakUpdatedAt = now;
			return;
		}

		// If already updated today, skip
		if (
			userState.streakUpdatedAt &&
			new Date(userState.streakUpdatedAt).toDateString() ===
				today.toDateString()
		) {
			return;
		}

		// Calculate the difference in days
		const diffDays = Math.floor(
			(today - lastLogin) / (1000 * 60 * 60 * 24)
		);

		if (diffDays === 1) {
			// Consecutive day
			userState.currentStreak += 1;
			userState.maxStreak = Math.max(
				userState.currentStreak,
				userState.maxStreak
			);
		} else if (diffDays > 1) {
			// Streak broken
			userState.currentStreak = 1;
		}

		userState.lastLoginDate = today;
		userState.streakUpdatedAt = now;
	}

	async getUserState(userId) {
		const t = await sequelize.transaction();

		try {
			// Get basic user state
			let userState = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (userState) {
				// Update streak information
				await this.updateStreak(userState);
				await userState.save({ transaction: t });

				// Get user upgrades, tasks, and events
				const [userUpgrades, userTasks, userEvents, userEventSettings] =
					await Promise.all([
						UserUpgrade.findAll({
							where: { userId },
							transaction: t,
						}),
						UserTask.findAll({
							where: { userId },
							transaction: t,
						}),
						UserEvent.findAll({
							where: {
								userId,
								status: 'ACTIVE',
							},
							transaction: t,
						}),
						UserEventSetting.findOne({
							where: { userId },
							transaction: t,
						}),
					]);

				// Convert to JSON for response
				const userStateObj = userState.toJSON
					? userState.toJSON()
					: { ...userState };

				// Add aggregated data from related tables
				userStateObj.upgrades = {
					items: userUpgrades,
					completed: userUpgrades.filter(
						(upgrade) => upgrade.completed
					).length,
					active: userUpgrades.filter((upgrade) => !upgrade.completed)
						.length,
				};

				userStateObj.tasks = {
					items: userTasks,
					completed: userTasks.filter((task) => task.completed)
						.length,
					active: userTasks.filter(
						(task) => task.active && !task.completed
					).length,
				};

				userStateObj.events = {
					active: userEvents,
					settings: userEventSettings || {},
				};

				await t.commit();
				return userStateObj;
			}

			await t.commit();
			return userState;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get user state: ${err.message}`);
		}
	}

	async createUserState(userId, userState, transaction) {
		try {
			await this.updateStreak(userState);

			// Create new state for new user
			const stateNew = await UserState.findOrCreate({
				where: { userId: userId },
				defaults: {
					userId: userId,
					state: userState.state,
					lastLoginDate: userState.lastLoginDate,
					currentStreak: userState.currentStreak,
					maxStreak: userState.maxStreak,
					streakUpdatedAt: userState.streakUpdatedAt,
					chaosLevel: userState.chaosLevel || 0.0,
					stabilityLevel: userState.stabilityLevel || 0.0,
					entropyVelocity: userState.entropyVelocity || 0.0,
					taskProgress: userState.taskProgress || {
						completedTasks: [],
						currentWeight: 0,
						unlockedNodes: [],
					},
					upgradeTree: userState.upgradeTree || {
						activeNodes: [],
						completedNodes: [],
						nodeStates: {},
						treeStructure: {},
						totalProgress: 0,
						lastNodeUpdate: new Date(),
					},
				},
				transaction: transaction,
			});

			// Initialize related data for the new user
			await Promise.all([
				upgradeService.initializeUserUpgradeTree(userId, transaction),
				taskService.initializeUserTasks(userId, transaction),
				eventService.initializeUserEvents(userId, transaction),
			]);

			return stateNew;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to create/update user state: ${err.message}`
			);
		}
	}

	async updateUserState(userId, userState) {
		const t = await sequelize.transaction();

		try {
			const stateData = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (stateData) {
				// Update basic state fields
				stateData.state = userState.state;
				stateData.chaosLevel =
					userState.chaosLevel !== undefined
						? userState.chaosLevel
						: stateData.chaosLevel;
				stateData.stabilityLevel =
					userState.stabilityLevel !== undefined
						? userState.stabilityLevel
						: stateData.stabilityLevel;
				stateData.entropyVelocity =
					userState.entropyVelocity !== undefined
						? userState.entropyVelocity
						: stateData.entropyVelocity;

				// Update streak information
				await this.updateStreak(stateData);
				await stateData.save({ transaction: t });

				// Get user upgrades, tasks, and events for the response
				const [userUpgrades, userTasks, userEvents, userEventSettings] =
					await Promise.all([
						UserUpgrade.findAll({
							where: { userId },
							transaction: t,
						}),
						UserTask.findAll({
							where: { userId },
							transaction: t,
						}),
						UserEvent.findAll({
							where: {
								userId,
								status: 'ACTIVE',
							},
							transaction: t,
						}),
						UserEventSetting.findOne({
							where: { userId },
							transaction: t,
						}),
					]);

				// Prepare response object
				const responseObj = {
					userId,
					userState: stateData.toJSON
						? stateData.toJSON()
						: { ...stateData },
				};

				// Add aggregated data from related tables
				responseObj.userState.upgrades = {
					items: userUpgrades,
					completed: userUpgrades.filter(
						(upgrade) => upgrade.completed
					).length,
					active: userUpgrades.filter((upgrade) => !upgrade.completed)
						.length,
				};

				responseObj.userState.tasks = {
					items: userTasks,
					completed: userTasks.filter((task) => task.completed)
						.length,
					active: userTasks.filter(
						(task) => task.active && !task.completed
					).length,
				};

				responseObj.userState.events = {
					active: userEvents,
					settings: userEventSettings || {},
				};

				await t.commit();
				return responseObj;
			}

			// Create new state for new user
			const stateNew = await UserState.create(
				{
					userId: userId,
					state: userState.state,
					chaosLevel: userState.chaosLevel || 0.0,
					stabilityLevel: userState.stabilityLevel || 0.0,
					entropyVelocity: userState.entropyVelocity || 0.0,
					taskProgress: {
						completedTasks: [],
						currentWeight: 0,
						unlockedNodes: [],
					},
					upgradeTree: {
						activeNodes: [],
						completedNodes: [],
						nodeStates: {},
						treeStructure: {},
						totalProgress: 0,
						lastNodeUpdate: new Date(),
					},
				},
				{ transaction: t }
			);

			await this.updateStreak(stateNew);

			// Initialize related data for the new user
			await Promise.all([
				upgradeService.initializeUserUpgradeTree(userId, t),
				taskService.initializeUserTasks(userId, t),
				eventService.initializeUserEvents(userId, t),
			]);

			await t.commit();
			return { userId, userState: stateNew };
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update user state: ${err.message}`
			);
		}
	}

	async leaderboard(userId) {
		const t = await sequelize.transaction();

		try {
			// Get user data and position in the leaderboard
			let userRating = null;
			let userData = null;

			if (userId) {
				const userState = await UserState.findOne({
					where: { userId },
					include: User,
					attributes: [
						'state',
						'currentStreak',
						'maxStreak',
						'updatedAt',
						'userId',
					],
					transaction: t,
				});

				if (userState) {
					const userStars = userState.state?.totalStars || 0;
					const userUpdatedAt = userState.updatedAt;

					// Count users with more stars or same stars but more recent update
					const higherUsers = await UserState.count({
						where: {
							[Op.or]: [
								sequelize.literal(
									`(state->>'totalStars')::integer > ${userStars}`
								),
								{
									[Op.and]: [
										sequelize.literal(
											`(state->>'totalStars')::integer = ${userStars}`
										),
										{
											updatedAt: {
												[Op.gt]: userUpdatedAt,
											},
										},
									],
								},
							],
						},
						transaction: t,
					});

					userRating = higherUsers + 1;
					userData = userState.toJSON();
					userData.rating = userRating;
				}
			}

			// Get top users based on LEADERBOARD_LIMIT
			const topUsers = await UserState.findAll(
				{
					include: User,
					order: [
						[
							sequelize.literal(
								"(state->>'totalStars')::integer"
							),
							'DESC',
						],
						['updatedAt', 'DESC'],
					],
					limit: LEADERBOARD_LIMIT,
					attributes: [
						'state',
						'currentStreak',
						'maxStreak',
						'updatedAt',
						'userId',
					],
				},
				{ transaction: t }
			);

			// Calculate ratings for top users
			const users = topUsers.map((item, index) => {
				const user = item.toJSON();
				user.rating = index + 1;
				return user;
			});

			// Check if user is already in the leaderboard
			const userInLeaderboard =
				userId && users.some((user) => user.userId === userId);

			// Add user data to the end of the leaderboard if not already included
			if (userId && userData && !userInLeaderboard) {
				users.push(userData);
			}

			await t.commit();
			return {
				leaderboard: users,
				userRating: userRating,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get leaderboard: ${err.message}`
			);
		}
	}

	async getUserUpgradeTree(userId) {
		try {
			// This method now delegates to the upgrade service
			return await upgradeService.getUserUpgradeNodes(userId);
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user upgrade tree: ${err.message}`
			);
		}
	}
}

module.exports = new UserStateService();
