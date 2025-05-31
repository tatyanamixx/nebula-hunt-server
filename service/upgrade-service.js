const { UpgradeNode, UserUpgradeNode, User } = require('../models/models');
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

				const newNode = await UpgradeNode.create(
					{
						id: node.id,
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
						reward: node.reward || 0,
						active: node.active ?? true,
						conditions: node.conditions || {},
						delayedUntil: node.delayedUntil || null,
						children: node.children || [],
						weight: node.weight || 1,
					},
					{ transaction: t }
				);

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

	async getAvailableUpgradeNodes(userId) {
		try {
			// Get all user's completed upgrades
			const completedUpgrades = await UserUpgradeNode.findAll({
				where: { userId, completed: true },
				include: [
					{
						model: UpgradeNode,
						attributes: ['id', 'name', 'children'],
					},
				],
			});

			// Collect all potentially unlocked node IDs
			const unlockedNodeIds = new Set();
			completedUpgrades.forEach((upgrade) => {
				if (upgrade.upgradenode && upgrade.upgradenode.children) {
					upgrade.upgradenode.children.forEach((childId) =>
						unlockedNodeIds.add(childId)
					);
				}
			});

			// Get all active nodes that are either root nodes (no conditions) or unlocked by completed upgrades
			const availableNodes = await UpgradeNode.findAll({
				where: {
					active: true,
					[Op.or]: [
						{ conditions: {} },
						{ id: Array.from(unlockedNodeIds) },
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

	async activateUserUpgradeNodes(userId) {
		try {
			const availableNodes = await this.getAvailableUpgradeNodes(userId);
			const userNodesRaw = await UserUpgradeNode.findAll({
				where: { userId },
			});

			const userNodes = userNodesRaw.map((item) => item.toJSON());
			const existingNodeIds = new Set(
				userNodes.map((un) => un.upgradeNodeId)
			);

			const newNodes = availableNodes.filter(
				(node) => !existingNodeIds.has(node.id)
			);

			if (newNodes.length > 0) {
				const newUserNodes = newNodes.map((node) => ({
					userId,
					upgradeNodeId: node.id,
					reward: 0,
					completed: false,
				}));
				await UserUpgradeNode.bulkCreate(newUserNodes);
			}

			const userNodesNew = await UserUpgradeNode.findAll({
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

			const totalReward = await UserUpgradeNode.sum('reward', {
				where: { userId },
			});

			const totalInstability = await UserUpgradeNode.sum('instability', {
				where: { userId },
			});

			return {
				reward: { upgrades: totalReward || 0 },
				instability: { upgrades: totalInstability || 0 },
				userUpgradeNodes: userNodesNew.map((item) => item.toJSON()),
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to activate user upgrade nodes: ${err.message}`
			);
		}
	}

	async getUserUpgradeNodes(userId) {
		try {
			const userNodes = await UserUpgradeNode.findAll({
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

			const totalReward = await UserUpgradeNode.sum('reward', {
				where: { userId },
			});

			const totalInstability = await UserUpgradeNode.sum('instability', {
				where: { userId },
			});

			return {
				reward: { upgrades: totalReward || 0 },
				instability: { upgrades: totalInstability || 0 },
				upgradeNodes: userNodes.map((item) => item.toJSON()),
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
			});

			if (!node) {
				throw ApiError.BadRequest('Upgrade node not found');
			}

			let userNode = await UserUpgradeNode.findOne({
				where: { userId, upgradeNodeId: nodeId },
			});

			if (!userNode) {
				userNode = await UserUpgradeNode.create(
					{
						userId,
						upgradeNodeId: nodeId,
						reward: node.reward,
						instability: node.instability,
						completed: true,
					},
					{ transaction: t }
				);
			} else if (!userNode.completed) {
				userNode.completed = true;
				userNode.reward = node.reward;
				userNode.instability = node.instability;
				await userNode.save({ transaction: t });
			}

			await t.commit();
			return userNode;
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
			const userNode = await UserUpgradeNode.findOne({
				where: { userId, upgradeNodeId: nodeId },
				include: [
					{
						model: UpgradeNode,
						attributes: [
							'id',
							'name',
							'children',
							'reward',
							'instability',
						],
					},
				],
				transaction: t,
			});

			if (!userNode) {
				throw ApiError.BadRequest('User upgrade node not found');
			}

			if (userNode.completed) {
				throw ApiError.BadRequest('Node is already completed');
			}

			// Update progress
			const newProgress = Math.min(
				userNode.progress + progressIncrement,
				userNode.targetProgress
			);
			const progressUpdate = {
				timestamp: new Date(),
				previousProgress: userNode.progress,
				increment: progressIncrement,
				newProgress: newProgress,
			};

			userNode.progress = newProgress;
			userNode.lastProgressUpdate = new Date();
			userNode.progressHistory = [
				...userNode.progressHistory,
				progressUpdate,
			];

			// Check if node is completed
			if (newProgress >= userNode.targetProgress && !userNode.completed) {
				userNode.completed = true;
				userNode.reward = userNode.upgradenode.reward;

				// Unlock child nodes if any
				if (
					userNode.upgradenode.children &&
					userNode.upgradenode.children.length > 0
				) {
					await this.unlockChildNodes(
						userId,
						userNode.upgradenode.children,
						t
					);
				}
			}

			await userNode.save({ transaction: t });
			await t.commit();

			return {
				nodeId: userNode.upgradenode.id,
				progress: userNode.progress,
				targetProgress: userNode.targetProgress,
				completed: userNode.completed,
				reward: userNode.reward,
				progressHistory: userNode.progressHistory,
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
			// Find all child nodes
			const childNodes = await UpgradeNode.findAll({
				where: {
					id: childNodeIds,
					active: true,
				},
				transaction,
			});

			// Create user nodes for newly unlocked children
			const existingUserNodes = await UserUpgradeNode.findAll({
				where: {
					userId,
					upgradeNodeId: childNodes.map((node) => node.id),
				},
				transaction,
			});

			const existingNodeIds = new Set(
				existingUserNodes.map((un) => un.upgradeNodeId)
			);
			const newNodes = childNodes.filter(
				(node) => !existingNodeIds.has(node.id)
			);

			if (newNodes.length > 0) {
				const newUserNodes = newNodes.map((node) => ({
					userId,
					upgradeNodeId: node.id,
					reward: 0,
					completed: false,
					progress: 0,
					targetProgress: node.conditions?.targetProgress || 100,
					progressHistory: [],
					lastProgressUpdate: new Date(),
				}));

				await UserUpgradeNode.bulkCreate(newUserNodes, { transaction });
			}

			return newNodes;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to unlock child nodes: ${err.message}`
			);
		}
	}

	async getUpgradeProgress(userId, nodeId) {
		try {
			const userNode = await UserUpgradeNode.findOne({
				where: { userId, upgradeNodeId: nodeId },
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
							'children',
							'reward',
							'instability',
						],
					},
				],
			});

			if (!userNode) {
				throw ApiError.BadRequest('User upgrade node not found');
			}

			return {
				nodeId: userNode.upgradeNodeId,
				nodeName: userNode.upgradenode.name,
				description: userNode.upgradenode.description,
				progress: userNode.progress,
				targetProgress: userNode.targetProgress,
				completed: userNode.completed,
				reward: userNode.reward,
				progressHistory: userNode.progressHistory,
				lastUpdate: userNode.lastProgressUpdate,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get upgrade progress: ${err.message}`
			);
		}
	}

	async getUserUpgradeProgress(userId) {
		try {
			const userNodes = await UserUpgradeNode.findAll({
				where: { userId },
				include: [
					{
						model: UpgradeNode,
						attributes: [
							'id',
							'name',
							'description',
							'children',
							'reward',
							'instability',
						],
					},
				],
			});

			const progress = userNodes.map((node) => ({
				nodeId: node.upgradeNodeId,
				nodeName: node.upgradenode.name,
				description: node.upgradenode.description,
				progress: node.progress,
				targetProgress: node.targetProgress,
				completed: node.completed,
				reward: node.reward,
				lastUpdate: node.lastProgressUpdate,
			}));

			const stats = {
				totalNodes: userNodes.length,
				completedNodes: userNodes.filter((node) => node.completed)
					.length,
				totalReward: userNodes.reduce(
					(sum, node) => sum + node.reward,
					0
				),
				averageProgress:
					userNodes.length > 0
						? userNodes.reduce(
								(sum, node) =>
									sum +
									(node.progress / node.targetProgress) * 100,
								0
						  ) / userNodes.length
						: 0,
			};

			return { progress, stats };
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user upgrade progress: ${err.message}`
			);
		}
	}
}

module.exports = new UpgradeService();
