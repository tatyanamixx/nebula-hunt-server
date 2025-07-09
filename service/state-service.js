/**
 * created by Tatyana Mikhniukevich on 08.05.2025
 */
const { UserState, User, UpgradeNode } = require('../models/models');
const loggerService = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const UpgradeService = require('./upgrade-service');
const sequelize = require('../db');
const { Op } = require('sequelize');

class UserStateService {
	async updateStreak(userState) {
		const now = new Date();
		// const today = new Date(
		// 	now.getFullYear(),
		// 	now.getMonth(),
		// 	now.getDate()
		// );

		const today = new Date(now);
		// loggerService.info(userState.userId, `today: ${today}`);
		// loggerService.info(userState.userId, `now: ${now}`);

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

		// Calculate the difference in hours
		const diffDays = Math.floor(
			(today - lastLogin) / (1000 * 60 * 60 * 24)
		);

		// loggerService.info(userState.userId, `diffDays: ${diffDays}`);

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
			let userState = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (userState) {
				await this.updateStreak(userState);
				await userState.save({ transaction: t });
				userState = await this.updateUpgradeTreeOnLogin(userId, t);
			}

			await t.commit();

			if (userState) {
				const userStateObj = userState.toJSON
					? userState.toJSON()
					: { ...userState };
				return userStateObj;
			}
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
			//await this.initializeUserUpgradeTree(userId, transaction);

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

			// Инициализируем поля апгрейтов, если их нет
			if (!userState.userUpgrades) userState.userUpgrades = {};
			if (!userState.completedUpgrades) userState.completedUpgrades = [];
			if (!userState.activeUpgrades) userState.activeUpgrades = [];

			// Получаем доступные узлы
			const availableNodes =
				await UpgradeService.getAvailableUpgradeNodes(userId);

			// Обновляем структуру дерева апгрейдов
			const upgradeTree = {
				activeNodes: availableNodes.map((node) => node.id),
				completedNodes: userState.completedUpgrades,
				nodeStates: {},
				treeStructure: {},
				totalProgress: 0,
				lastNodeUpdate: new Date(),
			};

			// Строим состояния узлов и структуру дерева
			for (const node of availableNodes) {
				const userNode = userState.userUpgrades[node.id];

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

			// Вычисляем общий прогресс
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

			// Обновляем состояние пользователя
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
			// Получаем все доступные узлы апгрейдов (теперь возвращаются все активные)
			const availableNodes =
				await UpgradeService.getAvailableUpgradeNodes();

			// Фильтруем корневые узлы (без условий)
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

			// Добавляем информацию о всех доступных узлах (не только корневых)
			// для построения полной структуры дерева
			for (const node of availableNodes) {
				// Пропускаем корневые узлы, которые уже обработаны
				if (!rootNodes.some((rootNode) => rootNode.id === node.id)) {
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
			}

			// Update user state
			const userState = await UserState.findOne({
				where: { userId },
				transaction,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем state, если его нет
			if (!userState.state) {
				userState.state = {
					totalStars: 0,
					stardustCount: 0,
					darkMatterCount: 0,
					tgStarsCount: 0,
					tokenTonsCount: 0,
					ownedGalaxiesCount: 0,
					ownedNodesCount: 0,
					ownedTasksCount: 0,
					ownedUpgradesCount: 0,
					ownedEventsCount: 0,
				};
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

	async leaderboard(userId) {
		const t = await sequelize.transaction();

		try {
			// Get count of users with more stars than the requested user
			let userRating = null;
			if (userId) {
				const userState = await UserState.findOne({
					where: { userId },
					attributes: ['state', 'updatedAt'],
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
				}
			}

			// Get top 100 users with full data
			const top100Users = await UserState.findAll(
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
					limit: 100,
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

			// Calculate ratings for top 100
			const users = top100Users.map((item, index) => {
				const user = item.toJSON();
				user.rating = index + 1;
				return user;
			});

			await t.commit();
			return {
				leaderboard: users,
				userRating: userRating,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update user state: ${err.message}`
			);
		}
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
