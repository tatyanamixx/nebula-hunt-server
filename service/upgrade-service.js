/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const { UpgradeNode, UserState } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');

class UpgradeService {
	async createUpgradeNodes(nodes) {
		const t = await sequelize.transaction();

		try {
			const createdNodes = [];
			for (const node of nodes) {
				// Validate node data
				if (!node.id || !node.name || !node.description) {
					throw ApiError.BadRequest(
						'Invalid upgrade node data structure'
					);
				}

				// Validate description structure
				if (!node.description.en || !node.description.ru) {
					throw ApiError.BadRequest(
						'Description must contain both "en" and "ru" translations'
					);
				}

				const newNode = await UpgradeNode.findOrCreate({
					where: { id: node.id },
					defaults: {
						name: node.name,
						description: {
							en: node.description.en,
							ru: node.description.ru,
						},
						maxLevel: node.maxLevel || 0,
						basePrice: node.basePrice || 0,
						effectPerLevel: node.effectPerLevel || 0,
						priceMultiplier: node.priceMultiplier || 1.0,
						currency: node.currency || 'stardust',
						category: node.category || 'production',
						icon: node.icon || '',
						instability: node.instability || 0.0,
						modifiers: node.modifiers || {},
						stability: node.stability || 0,
						active: node.active ?? true,
						conditions: node.conditions || {},
						delayedUntil: node.delayedUntil || null,
						children: node.children || [],
						weight: node.weight || 1,
					},
					transaction: t,
				});

				createdNodes.push(newNode);
			}

			await t.commit();
			return createdNodes;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to create upgrade nodes: ${err.message}`
			);
		}
	}

	async getAvailableUpgradeNodes() {
		try {
			const availableNodes = await UpgradeNode.findAll({
				where: {
					active: true,
					[Op.or]: [
						{ delayedUntil: null },
						{ delayedUntil: { [Op.lte]: new Date() } },
					],
				},
				attributes: [
					'id',
					'name',
					'description',
					'maxLevel',
					'basePrice',
					'effectPerLevel',
					'priceMultiplier',
					'currency',
					'category',
					'icon',
					'stability',
					'instability',
					'modifiers',
					'conditions',
					'delayedUntil',
					'children',
					'weight',
				],
			});
			return availableNodes;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get available upgrade nodes: ${err.message}`
			);
		}
	}

	async activateUserUpgradeNodes(userId, transaction) {
		try {
			// Получаем состояние пользователя
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

			// Получаем все доступные узлы
			const availableNodes = await UpgradeNode.findAll({
				where: {
					active: true,
					[Op.or]: [
						{ conditions: {} }, // корневые узлы
						{
							id: {
								[Op.in]: userState.completedUpgrades.flatMap(
									(upgradeId) => {
										const upgrade =
											userState.userUpgrades[upgradeId];
										return upgrade?.children || [];
									}
								),
							},
						},
					],
					[Op.and]: [
						{
							[Op.or]: [
								{ delayedUntil: null },
								{ delayedUntil: { [Op.lte]: new Date() } },
							],
						},
					],
				},
				attributes: [
					'id',
					'name',
					'description',
					'maxLevel',
					'basePrice',
					'effectPerLevel',
					'priceMultiplier',
					'currency',
					'category',
					'icon',
					'stability',
					'instability',
					'modifiers',
					'conditions',
					'delayedUntil',
					'children',
					'weight',
				],
				transaction,
			});

			// Обновляем активные апгрейды
			const existingNodeIds = new Set(
				Object.keys(userState.userUpgrades)
			);
			const newActiveNodes = [];

			for (const node of availableNodes) {
				if (!existingNodeIds.has(node.id)) {
					// Создаем новую запись для узла
					userState.userUpgrades[node.id] = {
						level: 0,
						progress: 0,
						targetProgress: 100,
						completed: false,
						stability: node.stability || 0.0,
						instability: node.instability || 0.0,
						progressHistory: [],
						lastProgressUpdate: new Date(),
					};
					newActiveNodes.push(node);
				}
			}

			// Обновляем время последней проверки
			userState.lastUpgradeCheck = new Date();
			await userState.save({ transaction });

			return newActiveNodes;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to activate user upgrade nodes: ${err.message}`
			);
		}
	}

	async getUserUpgradeNodes(userId) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля апгрейтов, если их нет
			if (!userState.userUpgrades) userState.userUpgrades = {};
			if (!userState.completedUpgrades) userState.completedUpgrades = [];

			// Получаем все апгрейды пользователя
			const userUpgrades = userState.userUpgrades;
			const upgradeNodes = [];

			// Получаем информацию о каждом апгрейде
			for (const [nodeId, upgradeData] of Object.entries(userUpgrades)) {
				const upgradeNode = await UpgradeNode.findByPk(nodeId);
				if (upgradeNode) {
					upgradeNodes.push({
						upgradeNodeId: nodeId,
						upgradenode: upgradeNode.toJSON(),
						...upgradeData,
					});
				}
			}

			// Вычисляем общую стабильность и нестабильность
			const totalStability = Object.values(userUpgrades).reduce(
				(sum, upgrade) => sum + (upgrade.stability || 0),
				0
			);

			const totalInstability = Object.values(userUpgrades).reduce(
				(sum, upgrade) => sum + (upgrade.instability || 0),
				0
			);

			return {
				stability: { upgrades: totalStability },
				instability: { upgrades: totalInstability },
				upgradeNodes: upgradeNodes,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user upgrade nodes: ${err.message}`
			);
		}
	}

	async completeUpgradeNode(userId, nodeId) {
		const t = await sequelize.transaction();

		try {
			const node = await UpgradeNode.findOne({
				where: { id: nodeId, active: true },
				transaction: t,
			});

			if (!node) {
				throw ApiError.BadRequest('Upgrade node not found');
			}

			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля апгрейтов, если их нет
			if (!userState.userUpgrades) userState.userUpgrades = {};
			if (!userState.completedUpgrades) userState.completedUpgrades = [];

			// Проверяем, есть ли уже запись для этого узла
			if (!userState.userUpgrades[nodeId]) {
				userState.userUpgrades[nodeId] = {
					level: 0,
					progress: 0,
					targetProgress: 100,
					completed: false,
					stability: 0.0,
					instability: 0.0,
					progressHistory: [],
					lastProgressUpdate: new Date(),
				};
			}

			const userUpgrade = userState.userUpgrades[nodeId];

			if (!userUpgrade.completed) {
				userUpgrade.completed = true;
				userUpgrade.stability = node.stability || 0.0;
				userUpgrade.instability = node.instability || 0.0;
				userUpgrade.lastProgressUpdate = new Date();

				// Добавляем в завершенные апгрейды
				if (!userState.completedUpgrades.includes(nodeId)) {
					userState.completedUpgrades.push(nodeId);
				}

				await userState.save({ transaction: t });
			}

			await t.commit();
			return userUpgrade;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to complete upgrade node: ${err.message}`
			);
		}
	}

	async updateUpgradeProgress(userId, nodeId, progressIncrement) {
		const t = await sequelize.transaction();

		try {
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля апгрейтов, если их нет
			if (!userState.userUpgrades) userState.userUpgrades = {};

			if (!userState.userUpgrades[nodeId]) {
				throw ApiError.BadRequest('User upgrade node not found');
			}

			const userUpgrade = userState.userUpgrades[nodeId];

			if (userUpgrade.completed) {
				throw ApiError.BadRequest('Node is already completed');
			}

			// Получаем информацию об узле
			const node = await UpgradeNode.findByPk(nodeId, { transaction: t });
			if (!node) {
				throw ApiError.BadRequest('Upgrade node not found');
			}

			// Обновляем прогресс
			const newProgress = Math.min(
				userUpgrade.progress + progressIncrement,
				userUpgrade.targetProgress
			);

			const progressUpdate = {
				timestamp: new Date(),
				previousProgress: userUpgrade.progress,
				increment: progressIncrement,
				newProgress: newProgress,
			};

			userUpgrade.progress = newProgress;
			userUpgrade.lastProgressUpdate = new Date();
			userUpgrade.progressHistory = [
				...userUpgrade.progressHistory,
				progressUpdate,
			];

			// Проверяем, завершен ли узел
			if (
				newProgress >= userUpgrade.targetProgress &&
				!userUpgrade.completed
			) {
				userUpgrade.completed = true;
				userUpgrade.stability = node.stability || 0.0;
				userUpgrade.instability = node.instability || 0.0;

				// Добавляем в завершенные апгрейды
				if (!userState.completedUpgrades)
					userState.completedUpgrades = [];
				if (!userState.completedUpgrades.includes(nodeId)) {
					userState.completedUpgrades.push(nodeId);
				}

				// Разблокируем дочерние узлы, если есть
				if (node.children && node.children.length > 0) {
					await this.unlockChildNodes(userId, node.children, t);
				}
			}

			await userState.save({ transaction: t });
			await t.commit();

			return {
				nodeId: nodeId,
				progress: userUpgrade.progress,
				targetProgress: userUpgrade.targetProgress,
				completed: userUpgrade.completed,
				stability: userUpgrade.stability,
				progressHistory: userUpgrade.progressHistory,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update upgrade progress: ${err.message}`
			);
		}
	}

	async unlockChildNodes(userId, childNodeIds, transaction) {
		try {
			// Находим все дочерние узлы
			const childNodes = await UpgradeNode.findAll({
				where: {
					id: childNodeIds,
					active: true,
				},
				transaction,
			});

			// Получаем состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
				transaction,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля апгрейтов, если их нет
			if (!userState.userUpgrades) userState.userUpgrades = {};
			if (!userState.activeUpgrades) userState.activeUpgrades = [];

			// Проверяем существующие узлы пользователя
			const existingNodeIds = new Set(
				Object.keys(userState.userUpgrades)
			);
			const newNodes = childNodes.filter(
				(node) => !existingNodeIds.has(node.id)
			);

			// Создаем записи для новых узлов
			for (const node of newNodes) {
				userState.userUpgrades[node.id] = {
					level: 0,
					progress: 0,
					targetProgress: node.conditions?.targetProgress || 100,
					completed: false,
					stability: 0.0,
					instability: 0.0,
					progressHistory: [],
					lastProgressUpdate: new Date(),
				};

				// Добавляем в активные апгрейды
				if (!userState.activeUpgrades.includes(node.id)) {
					userState.activeUpgrades.push(node.id);
				}
			}

			await userState.save({ transaction });

			return newNodes;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to unlock child nodes: ${err.message}`
			);
		}
	}

	async getUpgradeProgress(userId, nodeId) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (
				!userState ||
				!userState.userUpgrades ||
				!userState.userUpgrades[nodeId]
			) {
				throw ApiError.BadRequest('User upgrade node not found');
			}

			const upgradeNode = await UpgradeNode.findByPk(nodeId);
			if (!upgradeNode) {
				throw ApiError.BadRequest('Upgrade node not found');
			}

			const userUpgrade = userState.userUpgrades[nodeId];

			return {
				nodeId: upgradeNode.id,
				nodeName: upgradeNode.name,
				description: upgradeNode.description,
				progress: userUpgrade.progress,
				targetProgress: userUpgrade.targetProgress,
				completed: userUpgrade.completed,
				stability: userUpgrade.stability,
				instability: userUpgrade.instability,
				progressHistory: userUpgrade.progressHistory,
				lastUpdate: userUpgrade.lastProgressUpdate,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get upgrade progress: ${err.message}`
			);
		}
	}

	async getUserUpgradeProgress(userId) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState || !userState.userUpgrades) {
				return {
					progress: [],
					stats: {
						totalNodes: 0,
						completedNodes: 0,
						totalStability: 0,
						totalInstability: 0,
						averageProgress: 0,
					},
				};
			}

			const userUpgrades = userState.userUpgrades;
			const progress = [];

			// Получаем информацию о каждом апгрейде
			for (const [nodeId, upgradeData] of Object.entries(userUpgrades)) {
				const upgradeNode = await UpgradeNode.findByPk(nodeId);
				if (upgradeNode) {
					progress.push({
						nodeId: upgradeNode.id,
						nodeName: upgradeNode.name,
						description: upgradeNode.description,
						progress: upgradeData.progress,
						targetProgress: upgradeData.targetProgress,
						completed: upgradeData.completed,
						stability: upgradeData.stability,
						instability: upgradeData.instability,
						lastUpdate: upgradeData.lastProgressUpdate,
					});
				}
			}

			const stats = {
				totalNodes: progress.length,
				completedNodes: progress.filter((node) => node.completed)
					.length,
				totalStability: progress.reduce(
					(sum, node) => sum + node.stability,
					0
				),
				totalInstability: progress.reduce(
					(sum, node) => sum + node.instability,
					0
				),
				averageProgress:
					progress.length > 0
						? progress.reduce(
								(sum, node) =>
									sum +
									(node.progress / node.targetProgress) * 100,
								0
						  ) / progress.length
						: 0,
			};

			return { progress, stats };
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user upgrade progress: ${err.message}`
			);
		}
	}

	async getRootUpgradeNodes(transaction) {
		try {
			// Get only root nodes from UpgradeNode table
			const rootNodes = await UpgradeNode.findAll({
				where: {
					active: true,
					conditions: {}, // Only nodes without conditions
					[Op.or]: [
						{ delayedUntil: null },
						{ delayedUntil: { [Op.lte]: new Date() } },
					],
				},
				attributes: [
					'id',
					'name',
					'description',
					'maxLevel',
					'basePrice',
					'effectPerLevel',
					'priceMultiplier',
					'currency',
					'category',
					'icon',
					'stability',
					'instability',
					'modifiers',
					'conditions',
					'delayedUntil',
					'children',
					'weight',
				],
				transaction,
			});

			return rootNodes;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get root upgrade nodes: ${err.message}`
			);
		}
	}

	async initializeUserUpgradeTree(userId, transaction) {
		try {
			// Получаем состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
				transaction,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля апгрейтов
			userState.userUpgrades = {};
			userState.completedUpgrades = [];
			userState.activeUpgrades = [];
			userState.upgradeTree = {
				activeNodes: [],
				completedNodes: [],
				nodeStates: {},
				treeStructure: {},
				totalProgress: 0,
				lastNodeUpdate: new Date(),
			};
			userState.upgradeMultipliers = {
				production: 1.0,
				efficiency: 1.0,
				cost: 1.0,
				unlock: 1.0,
			};
			userState.lastUpgradeCheck = new Date();

			// Получаем корневые узлы
			const rootNodes = await this.getRootUpgradeNodes(transaction);

			// Создаем записи для корневых узлов
			for (const node of rootNodes) {
				userState.userUpgrades[node.id] = {
					level: 0,
					progress: 0,
					targetProgress: node.conditions?.targetProgress || 100,
					completed: false,
					stability: node.stability || 0.0,
					instability: node.instability || 0.0,
					progressHistory: [],
					lastProgressUpdate: new Date(),
				};
				userState.activeUpgrades.push(node.id);
			}

			await userState.save({ transaction });

			return {
				initializedNodes: rootNodes.map((node) => ({
					nodeId: node.id,
					name: node.name,
					description: node.description,
					category: node.category,
					basePrice: node.basePrice,
					currency: node.currency,
					maxLevel: node.maxLevel,
					effectPerLevel: node.effectPerLevel,
					priceMultiplier: node.priceMultiplier,
					stability: 0,
					instability: 0,
					progress: 0,
					targetProgress: node.conditions?.targetProgress || 100,
					completed: false,
				})),
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to initialize user upgrade tree: ${err.message}`
			);
		}
	}
}

module.exports = new UpgradeService();
