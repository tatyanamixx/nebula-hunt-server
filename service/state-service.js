const { UserState, User, UpgradeNode } = require('../models/models');
const loggerService = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const UpgradeService = require('./upgrade-service');
const sequelize = require('../db');
const { Op } = require('sequelize');

class UserStateService {
	async updateStreak(userState) {
		const now = new Date();
		const today = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		);
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
		// If diffDays === 0, it's the same day, don't update streak

		userState.lastLoginDate = today;
		userState.streakUpdatedAt = now;
	}

	async getUserState(userId) {
		const t = await sequelize.transaction();

		try {
			let userState = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (userState) {
				// Update streak on login
				await this.updateStreak(userState);
				await userState.save({ transaction: t });

				// Update upgrade tree on each state request
				userState = await this.updateUpgradeTreeOnLogin(userId, t);
			}

			await t.commit();
			return userState;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get user state: ${err.message}`);
		}
	}

	async createUserState(userId, userState, transaction) {
		// Create new state for new user

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
				},
				transaction: transaction,
			});

			
			// Initialize upgrade tree for new user
			await this.initializeUserUpgradeTree(userId, transaction);

			return stateNew;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to create/update user state: ${err.message}`
			);
		}
	}

	async updateUpgradeTreeOnLogin(userId, transaction) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
				transaction,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Get available nodes using UpgradeService
			const availableNodes =
				await UpgradeService.getAvailableUpgradeNodes(userId);

			// Get user's upgrade nodes
			const userUpgradeData = await UpgradeService.getUserUpgradeNodes(
				userId
			);
			const userNodes = userUpgradeData.upgradeNodes;

			// Update upgrade tree structure
			const upgradeTree = {
				activeNodes: availableNodes.map((node) => node.id),
				completedNodes: userNodes
					.filter((node) => node.completed)
					.map((node) => node.upgradeNodeId),
				nodeStates: {},
				treeStructure: {},
				totalProgress: 0,
				lastNodeUpdate: new Date(),
			};

			// Build node states and tree structure
			for (const node of availableNodes) {
				const userNode = userNodes.find(
					(un) => un.upgradeNodeId === node.id
				);

				upgradeTree.nodeStates[node.id] = {
					progress: userNode?.progress || 0,
					targetProgress:
						userNode?.targetProgress ||
						node.conditions?.targetProgress ||
						100,
					unlocked: true,
					completed: userNode?.completed || false,
					lastUpdate: userNode?.lastProgressUpdate || new Date(),
					progressHistory: userNode?.progressHistory || [],
				};

				upgradeTree.treeStructure[node.id] = {
					children: node.children || [],
					category: node.category,
					basePrice: node.basePrice,
					currency: node.currency,
					maxLevel: node.maxLevel,
					effectPerLevel: node.effectPerLevel,
					priceMultiplier: node.priceMultiplier,
					conditions: node.conditions,
				};
			}

			// Calculate total progress
			const totalNodes = Object.keys(upgradeTree.nodeStates).length;
			if (totalNodes > 0) {
				const progressSum = Object.values(
					upgradeTree.nodeStates
				).reduce(
					(sum, state) =>
						sum + (state.progress / state.targetProgress) * 100,
					0
				);
				upgradeTree.totalProgress = progressSum / totalNodes;
			}

			// Update user state
			userState.upgradeTree = upgradeTree;
			await userState.save({ transaction });

			return userState;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to update upgrade tree: ${err.message}`
			);
		}
	}

	async initializeUserUpgradeTree(userId, transaction) {
		try {
			// Get root nodes from UpgradeService
			const availableNodes =
				await UpgradeService.getAvailableUpgradeNodes(userId);
			const rootNodes = availableNodes.filter(
				(node) =>
					!node.conditions ||
					Object.keys(node.conditions).length === 0
			);

			// Initialize upgrade tree structure
			const upgradeTree = {
				activeNodes: rootNodes.map((node) => node.id),
				completedNodes: [],
				nodeStates: {},
				treeStructure: {},
				totalProgress: 0,
				lastNodeUpdate: new Date(),
			};

			// Initialize states for root nodes
			for (const node of rootNodes) {
				upgradeTree.nodeStates[node.id] = {
					progress: 0,
					targetProgress: node.conditions?.targetProgress || 100,
					unlocked: true,
					completed: false,
					lastUpdate: new Date(),
					progressHistory: [],
				};

				upgradeTree.treeStructure[node.id] = {
					children: node.children || [],
					category: node.category,
					basePrice: node.basePrice,
					currency: node.currency,
					maxLevel: node.maxLevel,
					effectPerLevel: node.effectPerLevel,
					priceMultiplier: node.priceMultiplier,
					conditions: node.conditions,
				};
			}

			// Update user state
			const userState = await UserState.findOne({
				where: { userId },
				transaction,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			userState.upgradeTree = upgradeTree;
			await userState.save({ transaction });

			return upgradeTree;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to initialize upgrade tree: ${err.message}`
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
				stateData.stars = userState.stars;
				stateData.state = userState.state;
				await this.updateStreak(stateData);
				// Update upgrade tree
				await this.updateUpgradeTreeOnLogin(userId, t);
				await stateData.save({ transaction: t });
				const string = JSON.stringify(stateData.state);

				await loggerService.logging(
					userId,
					'UPDATE',
					`The user ${userId} updated a state ${string}`,
					userState.stars,
					t
				);

				await t.commit();
				return { userId, userState: stateData };
			}

			// Create new state for new user
			const stateNew = await UserState.create(
				{
					userId: userId,
					stars: userState.stars,
					state: userState.state,
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
			// Initialize upgrade tree for new user
			await this.initializeUserUpgradeTree(userId, t);

			await t.commit();
			return { userId, userState: stateNew };
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update user state: ${err.message}`
			);
		}
	}

	async leaderboard() {
		const userlist = await UserState.findAll({
			include: User,
			order: [
				[sequelize.literal("(state->>'totalStars')::integer"), 'DESC'],
			],
			limit: 100,
			attributes: ['state', 'currentStreak', 'maxStreak'],
		});
		const users = userlist.map((item) => item.toJSON());

		return { leaderboard: users };
	}

	async updateUpgradeProgress(userId, nodeId, progressIncrement) {
		const userState = await UserState.findOne({
			where: { userId: userId },
		});
		if (userState) {
			userState.progress = Math.min(
				userState.progress + progressIncrement,
				100
			);
			await this.updateStreak(userState);
			await userState.save();
		}
	}

	async getUserUpgradeProgress(userId) {
		const userState = await UserState.findOne({
			where: { userId: userId },
		});
		if (userState) {
			return {
				progress: userState.progress,
				targetProgress: 100,
				progressHistory: [],
				lastProgressUpdate: userState.streakUpdatedAt,
				stats: {
					completedNodes: userState.progress === 100 ? 1 : 0,
					totalNodes: 1,
					averageProgress: userState.progress,
				},
			};
		}
		return null;
	}

	async getUserUpgradeTree(userId) {
		const userState = await UserState.findOne({
			where: { userId },
		});

		if (!userState || !userState.upgradeTree) {
			return await this.initializeUserUpgradeTree(userId);
		}

		const {
			activeNodes,
			completedNodes,
			nodeStates,
			treeStructure,
			totalProgress,
		} = userState.upgradeTree;

		return {
			activeNodes: activeNodes.map((nodeName) => ({
				name: nodeName,
				...nodeStates[nodeName],
				...treeStructure[nodeName],
			})),
			completedNodes: completedNodes.map((nodeName) => ({
				name: nodeName,
				...nodeStates[nodeName],
				...treeStructure[nodeName],
			})),
			treeStructure,
			totalProgress,
			stats: {
				totalNodes: Object.keys(nodeStates).length,
				activeCount: activeNodes.length,
				completedCount: completedNodes.length,
			},
		};
	}

	async resetUserUpgradeTree(userId) {
		const userState = await UserState.findOne({
			where: { userId },
		});

		if (!userState) {
			throw ApiError.BadRequest('User state not found');
		}

		// Reset the tree to initial state
		await this.initializeUserUpgradeTree(userId);
		return await this.getUserUpgradeTree(userId);
	}
}

module.exports = new UserStateService();
