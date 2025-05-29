const { UserState, User, UpgradeNode } = require('../models/models');
const loggerService = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const UpgradeService = require('./upgrade-service');
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
		const userState = await UserState.findOne({
			where: { userId: userId },
		});
		return userState;
	}

	async createUserState(userId, userState) {
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
				await stateData.save({ transaction: t });
				// Обновляем дерево улучшений при повторном входе
				await this.updateUpgradeTreeOnLogin(userId, t);
				await t.commit();
				return stateData;
			}

			// Создаем новое состояние для нового пользователя
			const stateNew = await UserState.create(
				{
					userId: userId,
					stars: userState.stars,
					state: userState.state,
				},
				{ transaction: t }
			);

			await this.updateStreak(stateNew);
			// Инициализируем дерево улучшений для нового пользователя
			await this.initializeUserUpgradeTree(userId, t);

			await t.commit();
			return stateNew;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to create/update user state: ${err.message}`
			);
		}
	}

	async updateUpgradeTreeOnLogin(userId, transaction) {
		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState || !userState.upgradeTree) {
			// Если дерева нет - создаем новое
			return await this.initializeUserUpgradeTree(userId, transaction);
		}

		// Получаем все активные узлы из базы
		const activeNodes = await UpgradeNode.findAll({
			where: {
				active: true,
				[Op.or]: [
					{ conditions: {} }, // Корневые узлы
					{ name: userState.upgradeTree.activeNodes }, // Уже активные узлы
				],
			},
			transaction,
		});

		// Обновляем структуру дерева
		const { treeStructure, nodeStates } = userState.upgradeTree;
		const updatedTreeStructure = { ...treeStructure };
		const updatedNodeStates = { ...nodeStates };

		// Добавляем новые узлы, если они появились
		for (const node of activeNodes) {
			if (!treeStructure[node.name]) {
				updatedTreeStructure[node.name] = {
					children: node.children || [],
					type: node.type,
					cost: node.cost,
					requirements: node.conditions,
				};

				updatedNodeStates[node.name] = {
					progress: 0,
					targetProgress: 100,
					unlocked: true,
					completed: false,
					lastUpdate: new Date(),
					progressHistory: [],
				};
			}
		}

		// Обновляем состояние дерева
		userState.upgradeTree = {
			...userState.upgradeTree,
			treeStructure: updatedTreeStructure,
			nodeStates: updatedNodeStates,
			lastNodeUpdate: new Date(),
		};

		await userState.save({ transaction });
		return userState.upgradeTree;
	}

	async initializeUserUpgradeTree(userId, transaction) {
		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw ApiError.BadRequest('User state not found');
		}

		// Получаем все корневые узлы
		const rootNodes = await UpgradeNode.findAll({
			where: {
				active: true,
				conditions: {},
			},
			transaction,
		});

		// Инициализируем структуру дерева
		const treeStructure = {};
		const nodeStates = {};

		// Создаем начальную структуру
		for (const node of rootNodes) {
			treeStructure[node.name] = {
				children: node.children || [],
				type: node.type,
				cost: node.cost,
				requirements: node.conditions,
			};

			nodeStates[node.name] = {
				progress: 0,
				targetProgress: 100,
				unlocked: true,
				completed: false,
				lastUpdate: new Date(),
				progressHistory: [],
			};
		}

		userState.upgradeTree = {
			activeNodes: rootNodes.map((node) => node.name),
			completedNodes: [],
			nodeStates,
			treeStructure,
			totalProgress: 0,
			lastNodeUpdate: new Date(),
		};

		await userState.save({ transaction });
		return userState.upgradeTree;
	}

	async updateUserState(userId, userState) {
		const stateData = await UserState.findOne({
			where: { userId: userId },
		});
		if (stateData) {
			stateData.stars = userState.stars;
			stateData.state = userState.state;
			await this.updateStreak(stateData);
			await stateData.save();
			const string = JSON.stringify(stateData.state);

			await loggerService.logging(
				userId,
				'UPDATE',
				`The user ${userId} updated a state ${string}`,
				userState.stars
			);
			return { userId, userState: stateData };
		}
		const stateNew = await UserState.create({
			userId: userId,
			stars: userState.stars,
			state: userState.state,
		});
		await this.updateStreak(stateNew);
		return { userId, userState: stateNew };
	}

	async leaderboard() {
		const userlist = await UserState.findAll({
			include: User,
			order: [['stars', 'DESC']],
			limit: 100,
			attributes: ['stars', 'state', 'currentStreak', 'maxStreak'],
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
