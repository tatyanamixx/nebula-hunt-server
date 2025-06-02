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
				console.log('node', node);
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

	async getAvailableUpgradeNodes(userId) {
		const t = await sequelize.transaction();
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
				transaction: t,
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
		try {
			// Get all available nodes from UpgradeNode
			const availableNodes = await UpgradeNode.findAll({
				where: {
					active: true,
					[Op.or]: [
						{ conditions: {} }, // root nodes
						{
							id: {
								[Op.in]: sequelize.literal(`(
									SELECT UNNEST(children) 
									FROM "upgradenodes" un 
									JOIN "userupgradenodes" uun ON un.id = uun."upgradenodeId" 
									WHERE uun."userId" = ${userId} 
									AND uun.completed = true
								)`),
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

			// Get user's existing nodes
			const userNodesRaw = await UserUpgradeNode.findAll({
				where: { userId },
				transaction,
			});

			const userNodes = userNodesRaw.map((item) => item.toJSON());
			const existingNodeIds = new Set(
				userNodes.map((un) => un.upgradenodeId)
			);

			// Filter out nodes that user already has
			const newNodes = availableNodes.filter(
				(node) => !existingNodeIds.has(node.id)
			);

			if (newNodes.length > 0) {
				const newUserNodes = newNodes.map((node) => ({
					userId,
					upgradenodeId: node.id,
					stability: 0,
					instability: 0,
					completed: false,
					progress: 0,
					targetProgress: node.conditions?.targetProgress || 100,
					progressHistory: [],
					lastProgressUpdate: new Date(),
				}));

				await UserUpgradeNode.bulkCreate(newUserNodes, { transaction });
			}

			// Get updated user nodes with all information
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
				transaction,
			});

			// Calculate totals
			const totalStability = await UserUpgradeNode.sum('stability', {
				where: { userId },
				transaction,
			});

			const totalInstability = await UserUpgradeNode.sum('instability', {
				where: { userId },
				transaction,
			});

			return {
				stability: { upgrades: totalStability || 0 },
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
			const active = await this.activateUserUpgradeNodes(userId);
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

			const totalStability = await UserUpgradeNode.sum('stability', {
				where: { userId },
			});

			const totalInstability = await UserUpgradeNode.sum('instability', {
				where: { userId },
			});

			return {
				stability: { upgrades: totalStability || 0 },
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
				where: { userId, upgradenodeId: nodeId },
			});

			if (!userNode) {
				userNode = await UserUpgradeNode.create(
					{
						userId,
						upgradenodeId: nodeId,
						stability: node.stability,
						instability: node.instability,
						completed: true,
					},
					{ transaction: t }
				);
			} else if (!userNode.completed) {
				userNode.completed = true;
				userNode.stability = node.stability;
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
				where: { userId, upgradenodeId: nodeId },
				include: [
					{
						model: UpgradeNode,
						attributes: [
							'id',
							'name',
							'children',
							'stability',
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
				userNode.stability = userNode.upgradenode.stability;

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
				stability: userNode.stability,
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
					upgradenodeId: childNodes.map((node) => node.id),
				},
				transaction,
			});

			const existingNodeIds = new Set(
				existingUserNodes.map((un) => un.upgradenodeId)
			);
			const newNodes = childNodes.filter(
				(node) => !existingNodeIds.has(node.id)
			);

			if (newNodes.length > 0) {
				const newUserNodes = newNodes.map((node) => ({
					userId,
					upgradenodeId: node.id,
					stability: 0,
					instability: 0,
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
				where: { userId, upgradenodeId: nodeId },
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
							'stability',
							'instability',
						],
					},
				],
			});

			if (!userNode) {
				throw ApiError.BadRequest('User upgrade node not found');
			}

			return {
				nodeId: userNode.upgradenode.id,
				nodeName: userNode.upgradenode.name,
				description: userNode.upgradenode.description,
				progress: userNode.progress,
				targetProgress: userNode.targetProgress,
				completed: userNode.completed,
				stability: userNode.stability,
				instability: userNode.instability,
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
							'stability',
							'instability',
						],
					},
				],
			});

			const progress = userNodes.map((node) => ({
				nodeId: node.upgradenode.id,
				nodeName: node.upgradenode.name,
				description: node.upgradenode.description,
				progress: node.progress,
				targetProgress: node.targetProgress,
				completed: node.completed,
				stability: node.stability,
				instability: node.instability,
				lastUpdate: node.lastProgressUpdate,
			}));

			const stats = {
				totalNodes: userNodes.length,
				completedNodes: userNodes.filter((node) => node.completed)
					.length,
				totalStability: userNodes.reduce(
					(sum, node) => sum + node.stability,
					0
				),
				totalInstability: userNodes.reduce(
					(sum, node) => sum + node.instability,
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
			// Get root nodes directly from UpgradeNode table
			const rootNodes = await this.getRootUpgradeNodes(transaction);

			// Create user nodes for root nodes
			const userNodes = rootNodes.map((node) => ({
				userId,
				upgradenodeId: node.id,
				stability: 0,
				instability: 0,
				completed: false,
				progress: 0,
				targetProgress: node.conditions?.targetProgress || 100,
				progressHistory: [],
				lastProgressUpdate: new Date(),
			}));

			// Bulk create user nodes
			await UserUpgradeNode.bulkCreate(userNodes, { transaction });

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
