/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const { UpgradeNode, UserState, UserUpgrade } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');
const marketService = require('./market-service');

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

	async updateUpgradeNode(nodeId, nodeData) {
		const t = await sequelize.transaction();

		try {
			// Ищем узел по ID
			const node = await UpgradeNode.findByPk(nodeId, { transaction: t });

			if (!node) {
				await t.rollback();
				throw ApiError.NotFound('Upgrade node not found');
			}

			// Обновляем данные узла
			await node.update(nodeData, { transaction: t });

			await t.commit();
			return node;
		} catch (err) {
			await t.rollback();
			throw ApiError.BadRequest(
				'Failed to update upgrade node: ' + err.message
			);
		}
	}

	async deleteUpgradeNode(nodeId) {
		const t = await sequelize.transaction();

		try {
			const node = await UpgradeNode.findByPk(nodeId, { transaction: t });

			if (!node) {
				await t.rollback();
				throw ApiError.NotFound('Upgrade node not found');
			}

			await node.destroy({ transaction: t });

			await t.commit();
			return { message: 'Upgrade node deleted successfully' };
		} catch (err) {
			await t.rollback();
			throw ApiError.BadRequest(
				'Failed to delete upgrade node: ' + err.message
			);
		}
	}

	async getAvailableUpgradeNodes() {
		const t = await sequelize.transaction();

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
				transaction: t,
			});

			await t.commit();
			return availableNodes;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get available upgrade nodes: ${err.message}`
			);
		}
	}

	async activateUserUpgradeNodes(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const externalTransaction = !!transaction;

		try {
			// Получаем все завершенные апгрейды пользователя
			const completedUpgrades = await UserUpgrade.findAll({
				where: {
					userId,
					completed: true,
				},
				attributes: ['nodeId'],
				transaction: t,
			});

			const completedNodeIds = completedUpgrades.map(
				(upgrade) => upgrade.nodeId
			);

			// Получаем все доступные узлы на основе завершенных апгрейдов
			const availableNodes = await UpgradeNode.findAll({
				where: {
					active: true,
					[Op.or]: [
						{ conditions: {} }, // корневые узлы
						{
							id: {
								[Op.in]: completedNodeIds.flatMap((nodeId) => {
									const node = availableNodes.find(
										(n) => n.id === nodeId
									);
									return node?.children || [];
								}),
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
				transaction: t,
			});

			// Получаем существующие апгрейды пользователя
			const existingUpgrades = await UserUpgrade.findAll({
				where: { userId },
				attributes: ['nodeId'],
				transaction: t,
			});

			const existingNodeIds = new Set(
				existingUpgrades.map((upgrade) => upgrade.nodeId)
			);
			const newActiveNodes = [];

			// Создаем записи для новых апгрейдов
			for (const node of availableNodes) {
				if (!existingNodeIds.has(node.id)) {
					await UserUpgrade.create(
						{
							userId,
							nodeId: node.id,
							level: 0,
							progress: 0,
							targetProgress: 100,
							completed: false,
							stability: node.stability || 0.0,
							instability: node.instability || 0.0,
							progressHistory: [],
							lastProgressUpdate: new Date(),
						},
						{ transaction: t }
					);

					newActiveNodes.push(node);
				}
			}

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				const activeUpgradeCount = await UserUpgrade.count({
					where: {
						userId,
						completed: false,
					},
					transaction: t,
				});

				const completedUpgradeCount = await UserUpgrade.count({
					where: {
						userId,
						completed: true,
					},
					transaction: t,
				});

				userState.state.ownedNodesCount =
					activeUpgradeCount + completedUpgradeCount;
				userState.state.ownedUpgradesCount = completedUpgradeCount;
				await userState.save({ transaction: t });
			}

			if (!externalTransaction) {
				await t.commit();
			}

			return newActiveNodes;
		} catch (err) {
			if (!externalTransaction) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to activate user upgrade nodes: ${err.message}`
			);
		}
	}

	async getUserUpgradeNodes(userId) {
		try {
			// Получаем все апгрейды пользователя с информацией о нодах
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				include: [
					{
						model: UpgradeNode,
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
					},
				],
			});

			// Разделяем на активные и завершенные
			const activeNodes = userUpgrades
				.filter((upgrade) => !upgrade.completed)
				.map((upgrade) => ({
					...upgrade.toJSON(),
					node: upgrade.upgradenode,
				}));

			const completedNodes = userUpgrades
				.filter((upgrade) => upgrade.completed)
				.map((upgrade) => ({
					...upgrade.toJSON(),
					node: upgrade.upgradenode,
				}));

			return {
				activeNodes,
				completedNodes,
				totalNodes: userUpgrades.length,
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
			// Находим апгрейд пользователя
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					nodeId,
				},
				transaction: t,
			});

			if (!userUpgrade) {
				await t.rollback();
				throw ApiError.BadRequest('User upgrade node not found');
			}

			// Проверяем, достаточно ли прогресса для завершения
			if (userUpgrade.progress < userUpgrade.targetProgress) {
				await t.rollback();
				throw ApiError.BadRequest(
					'Not enough progress to complete this upgrade node'
				);
			}

			// Получаем информацию об узле апгрейда
			const upgradeNode = await UpgradeNode.findByPk(nodeId, {
				transaction: t,
			});

			if (!upgradeNode) {
				await t.rollback();
				throw ApiError.BadRequest('Upgrade node not found');
			}

			// Регистрируем платеж за апгрейд
			await marketService.registerUpgradePayment({
				userId,
				nodeId,
				amount: upgradeNode.basePrice,
				currency: upgradeNode.currency,
			});

			// Помечаем апгрейд как завершенный
			userUpgrade.completed = true;
			await userUpgrade.save({ transaction: t });

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				userState.state.ownedUpgradesCount =
					(userState.state.ownedUpgradesCount || 0) + 1;
				await userState.save({ transaction: t });
			}

			// Активируем дочерние узлы
			if (upgradeNode.children && upgradeNode.children.length > 0) {
				await this.unlockChildNodes(userId, upgradeNode.children, t);
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
			// Находим апгрейд пользователя
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					nodeId,
				},
				transaction: t,
			});

			if (!userUpgrade) {
				await t.rollback();
				throw ApiError.BadRequest('User upgrade node not found');
			}

			// Если апгрейд уже завершен, ничего не делаем
			if (userUpgrade.completed) {
				await t.rollback();
				return userUpgrade;
			}

			// Обновляем прогресс
			const oldProgress = userUpgrade.progress;
			userUpgrade.progress = Math.min(
				userUpgrade.progress + progressIncrement,
				userUpgrade.targetProgress
			);

			// Добавляем запись в историю прогресса
			const now = new Date();
			userUpgrade.progressHistory.push({
				timestamp: now,
				oldValue: oldProgress,
				newValue: userUpgrade.progress,
				increment: progressIncrement,
			});

			userUpgrade.lastProgressUpdate = now;
			await userUpgrade.save({ transaction: t });

			// Если прогресс достиг цели, помечаем как завершенный
			if (userUpgrade.progress >= userUpgrade.targetProgress) {
				userUpgrade.completed = true;
				await userUpgrade.save({ transaction: t });

				// Обновляем счетчик в UserState
				const userState = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				if (userState && userState.state) {
					userState.state.ownedUpgradesCount =
						(userState.state.ownedUpgradesCount || 0) + 1;
					await userState.save({ transaction: t });
				}

				// Активируем дочерние узлы
				const upgradeNode = await UpgradeNode.findByPk(nodeId, {
					transaction: t,
				});

				if (
					upgradeNode &&
					upgradeNode.children &&
					upgradeNode.children.length > 0
				) {
					await this.unlockChildNodes(
						userId,
						upgradeNode.children,
						t
					);
				}
			}

			await t.commit();
			return userUpgrade;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update upgrade progress: ${err.message}`
			);
		}
	}

	async unlockChildNodes(userId, childNodeIds, transaction) {
		const t = transaction || (await sequelize.transaction());
		const externalTransaction = !!transaction;

		try {
			// Получаем информацию о дочерних узлах
			const childNodes = await UpgradeNode.findAll({
				where: {
					id: { [Op.in]: childNodeIds },
					active: true,
				},
				transaction: t,
			});

			// Создаем записи для дочерних узлов
			for (const node of childNodes) {
				// Проверяем, существует ли уже такой апгрейд
				const existingUpgrade = await UserUpgrade.findOne({
					where: {
						userId,
						nodeId: node.id,
					},
					transaction: t,
				});

				// Если апгрейд не существует, создаем его
				if (!existingUpgrade) {
					await UserUpgrade.create(
						{
							userId,
							nodeId: node.id,
							level: 0,
							progress: 0,
							targetProgress: 100,
							completed: false,
							stability: node.stability || 0.0,
							instability: node.instability || 0.0,
							progressHistory: [],
							lastProgressUpdate: new Date(),
						},
						{ transaction: t }
					);
				}
			}

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				const activeUpgradeCount = await UserUpgrade.count({
					where: {
						userId,
						completed: false,
					},
					transaction: t,
				});

				userState.state.ownedNodesCount =
					(userState.state.ownedUpgradesCount || 0) +
					activeUpgradeCount;
				await userState.save({ transaction: t });
			}

			if (!externalTransaction) {
				await t.commit();
			}

			return childNodes;
		} catch (err) {
			if (!externalTransaction) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to unlock child nodes: ${err.message}`
			);
		}
	}

	async getUpgradeProgress(userId, nodeId) {
		try {
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					nodeId,
				},
				include: [
					{
						model: UpgradeNode,
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
							'children',
							'weight',
						],
					},
				],
			});

			if (!userUpgrade) {
				throw ApiError.BadRequest('User upgrade node not found');
			}

			return {
				id: userUpgrade.id,
				userId: userUpgrade.userId,
				nodeId: userUpgrade.nodeId,
				level: userUpgrade.level,
				progress: userUpgrade.progress,
				targetProgress: userUpgrade.targetProgress,
				completed: userUpgrade.completed,
				stability: userUpgrade.stability,
				instability: userUpgrade.instability,
				progressHistory: userUpgrade.progressHistory,
				lastProgressUpdate: userUpgrade.lastProgressUpdate,
				node: userUpgrade.upgradenode,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get upgrade progress: ${err.message}`
			);
		}
	}

	async getUserUpgradeProgress(userId) {
		try {
			// Получаем все апгрейды пользователя
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				include: [
					{
						model: UpgradeNode,
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
							'children',
							'weight',
						],
					},
				],
			});

			// Вычисляем общий прогресс
			let totalProgress = 0;
			const totalNodes = userUpgrades.length;

			if (totalNodes > 0) {
				const progressSum = userUpgrades.reduce(
					(sum, upgrade) =>
						sum + (upgrade.progress / upgrade.targetProgress) * 100,
					0
				);
				totalProgress = progressSum / totalNodes;
			}

			// Находим последнее обновление
			const lastUpdate = userUpgrades.reduce((latest, upgrade) => {
				return upgrade.lastProgressUpdate > latest
					? upgrade.lastProgressUpdate
					: latest;
			}, new Date(0));

			// Считаем статистику
			const completedNodes = userUpgrades.filter(
				(upgrade) => upgrade.completed
			).length;

			return {
				progress: totalProgress,
				targetProgress: 100,
				progressHistory: [],
				lastProgressUpdate: lastUpdate,
				stats: {
					completedNodes,
					totalNodes,
					averageProgress: totalProgress,
				},
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user upgrade progress: ${err.message}`
			);
		}
	}

	async getRootUpgradeNodes(transaction) {
		const t = transaction || (await sequelize.transaction());
		const externalTransaction = !!transaction;

		try {
			// Получаем все корневые узлы (без условий или с пустыми условиями)
			const rootNodes = await UpgradeNode.findAll({
				where: {
					active: true,
					[Op.or]: [
						{ conditions: null },
						{ conditions: {} },
						{
							conditions: {
								[Op.eq]: {},
							},
						},
					],
				},
				transaction: t,
			});

			if (!externalTransaction) {
				await t.commit();
			}

			return rootNodes;
		} catch (err) {
			if (!externalTransaction) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to get root upgrade nodes: ${err.message}`
			);
		}
	}

	async initializeUserUpgradeTree(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const externalTransaction = !!transaction;

		try {
			// Получаем корневые узлы
			const rootNodes = await this.getRootUpgradeNodes(t);

			// Создаем записи для корневых узлов
			for (const node of rootNodes) {
				// Проверяем, существует ли уже такой апгрейд
				const existingUpgrade = await UserUpgrade.findOne({
					where: {
						userId,
						nodeId: node.id,
					},
					transaction: t,
				});

				// Если апгрейд не существует, создаем его
				if (!existingUpgrade) {
					await UserUpgrade.create(
						{
							userId,
							nodeId: node.id,
							level: 0,
							progress: 0,
							targetProgress: 100,
							completed: false,
							stability: node.stability || 0.0,
							instability: node.instability || 0.0,
							progressHistory: [],
							lastProgressUpdate: new Date(),
						},
						{ transaction: t }
					);
				}
			}

			// Обновляем счетчик в UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				const activeUpgradeCount = await UserUpgrade.count({
					where: {
						userId,
						completed: false,
					},
					transaction: t,
				});

				userState.state.ownedNodesCount = activeUpgradeCount;
				await userState.save({ transaction: t });
			}

			if (!externalTransaction) {
				await t.commit();
			}

			return await this.getUserUpgradeNodes(userId);
		} catch (err) {
			if (!externalTransaction) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to initialize user upgrade tree: ${err.message}`
			);
		}
	}

	async getUserUpgradeNode(userId, nodeId) {
		try {
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					nodeId,
				},
				include: [
					{
						model: UpgradeNode,
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
							'children',
							'weight',
						],
					},
				],
			});

			if (!userUpgrade) {
				throw ApiError.BadRequest('User upgrade node not found');
			}

			return {
				id: userUpgrade.id,
				userId: userUpgrade.userId,
				nodeId: userUpgrade.nodeId,
				level: userUpgrade.level,
				progress: userUpgrade.progress,
				targetProgress: userUpgrade.targetProgress,
				completed: userUpgrade.completed,
				stability: userUpgrade.stability,
				instability: userUpgrade.instability,
				progressHistory: userUpgrade.progressHistory,
				lastProgressUpdate: userUpgrade.lastProgressUpdate,
				node: userUpgrade.upgradenode,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user upgrade node: ${err.message}`
			);
		}
	}

	async getUserUpgradeStats(userId) {
		const t = await sequelize.transaction();

		try {
			// Get all user upgrades
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				transaction: t,
			});

			// Calculate statistics
			const totalUpgrades = userUpgrades.length;
			const completedUpgrades = userUpgrades.filter(
				(upgrade) => upgrade.completed
			).length;
			const activeUpgrades = totalUpgrades - completedUpgrades;

			// Get categories
			const nodes = await UpgradeNode.findAll({
				where: {
					id: {
						[Op.in]: userUpgrades.map((upgrade) => upgrade.nodeId),
					},
				},
				transaction: t,
			});

			// Calculate stats by category
			const categoriesMap = {};
			for (const node of nodes) {
				const userUpgrade = userUpgrades.find(
					(upgrade) => upgrade.nodeId === node.id
				);

				if (!userUpgrade) continue;

				const category = node.category || 'unknown';
				if (!categoriesMap[category]) {
					categoriesMap[category] = {
						total: 0,
						completed: 0,
						active: 0,
					};
				}

				categoriesMap[category].total++;
				if (userUpgrade.completed) {
					categoriesMap[category].completed++;
				} else {
					categoriesMap[category].active++;
				}
			}

			// Calculate overall progress
			const overallProgress =
				totalUpgrades > 0
					? (completedUpgrades / totalUpgrades) * 100
					: 0;

			await t.commit();

			return {
				total: totalUpgrades,
				completed: completedUpgrades,
				active: activeUpgrades,
				overallProgress,
				categories: categoriesMap,
				lastUpdate: new Date(),
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user upgrade stats: ${err.message}`
			);
		}
	}
}

module.exports = new UpgradeService();
