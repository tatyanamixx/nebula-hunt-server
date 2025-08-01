/**
 * created by Claude on 15.07.2025
 */
const {
	UpgradeNodeTemplate,
	UserUpgrade,
	UserState,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');
const logger = require('./logger-service');
class UpgradeService {
	/**
	 * Initialize the upgrade tree for a new user
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<Array>} Initialized user upgrades
	 */
	async initializeUserUpgradeTree(userId, t) {
		const transaction = t || (await sequelize.transaction());
		const shouldCommit = !transaction; // Коммитим только если транзакция не была передана
		try {
			const userUpgrades = [];
			logger.debug('initializeUserUpgradeTree', userId);
			// Get all root upgrade nodes (those without parent requirements)
			const rootNodes = await UpgradeNodeTemplate.findAll({
				where: {
					active: true,
					// [Op.or]: [
					// 	{ '$conditions.parents$': null },
					// 	{ '$conditions.parents$': [] },
					// 	{ $conditions$: {} },
					// ],
				},
				transaction: transaction,
			});
			logger.debug('rootNodes', rootNodes);
			// Create initial user upgrades for root nodes
			if (rootNodes.length > 0) {
				for (const node of rootNodes) {
					const userUpgrade = await UserUpgrade.create(
						{
							userId,
							upgradeNodeTemplateId: node.id,
							level: 0,
							progress: 0,
							targetProgress: 100,
							completed: false,
							stability: node.stability || 0,
							instability: node.instability || 0,
							progressHistory: [
								{
									timestamp: Date.now(),
									progress: 0,
									level: 0,
								},
							],
							lastProgressUpdate: new Date(),
						},
						{ transaction: transaction }
					);
					userUpgrades.push(userUpgrade);
				}
			}

			if (shouldCommit && !t.finished) {
				await t.commit();
			}
			return userUpgrades;
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to initialize user upgrade tree: ${err.message}`
			);
		}
	}

	/**
	 * Activate available upgrade nodes for a user
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<Array>} Newly activated user upgrades
	 */
	async activateUserUpgradeNodes(userId, t) {
		try {
			// Get all user upgrades
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				transaction: t,
			});

			// Create a map of user upgrades for quick lookup
			const userUpgradeMap = {};
			userUpgrades.forEach((upgrade) => {
				userUpgradeMap[upgrade.upgradeNodeTemplateId] = upgrade;
			});

			// Get all active upgrade nodes
			const upgradeNodes = await UpgradeNodeTemplate.findAll({
				where: { active: true },
				transaction: t,
			});

			// Find nodes that should be activated
			const nodesToActivate = [];
			for (const node of upgradeNodes) {
				// Skip if user already has this node
				if (userUpgradeMap[node.id]) {
					continue;
				}

				// Check if the node has parent requirements
				if (
					node.conditions &&
					node.conditions.parents &&
					Array.isArray(node.conditions.parents)
				) {
					let allParentsCompleted = true;
					// Check if all parent upgrades are completed
					for (const parentId of node.conditions.parents) {
						const parentUpgrade = userUpgradeMap[parentId];
						if (
							!parentUpgrade ||
							!parentUpgrade.completed ||
							(node.conditions.parentLevel &&
								parentUpgrade.level <
									node.conditions.parentLevel)
						) {
							allParentsCompleted = false;
							break;
						}
					}

					if (allParentsCompleted) {
						nodesToActivate.push(node);
					}
				}
			}

			// Create user upgrades for nodes to activate
			const newUserUpgrades = [];
			for (const node of nodesToActivate) {
				const userUpgrade = await UserUpgrade.create(
					{
						userId,
						upgradeNodeTemplateId: node.id,
						level: 0,
						progress: 0,
						targetProgress: 100,
						completed: false,
						stability: node.stability || 0,
						instability: node.instability || 0,
						progressHistory: [
							{
								timestamp: Date.now(),
								progress: 0,
								level: 0,
							},
						],
						lastProgressUpdate: new Date(),
					},
					{ transaction: t }
				);
				newUserUpgrades.push(userUpgrade);
			}

			return newUserUpgrades;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to activate user upgrade nodes: ${err.message}`
			);
		}
	}

	/**
	 * Get all upgrades for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Array>} User upgrades
	 */
	async getUserUpgrades(userId) {
		try {
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				include: [
					{
						model: UpgradeNodeTemplate,
						attributes: [
							'id',
							'name',
							'description',
							'maxLevel',
							'basePrice',
							'effectPerLevel',
							'priceMultiplier',
							'category',
							'icon',
							'stability',
							'instability',
							'modifiers',
							'active',
							'conditions',
							'children',
							'weight',
						],
					},
				],
			});

			return userUpgrades;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get user upgrades: ${err.message}`
			);
		}
	}

	/**
	 * Get a specific upgrade for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Upgrade node ID
	 * @returns {Promise<Object>} User upgrade
	 */
	async getUserUpgrade(userId, slug) {
		try {
			const upgradeNode = await UpgradeNodeTemplate.findOne({
				where: { slug },
			});
			if (!upgradeNode) {
				throw ApiError.NotFound('Upgrade node not found');
			}
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					upgradeNodeTemplateId: upgradeNode.id,
				},
				include: [
					{
						model: UpgradeNodeTemplate,
						attributes: [
							'id',
							'slug',
							'name',
							'description',
							'maxLevel',
							'basePrice',
							'effectPerLevel',
							'priceMultiplier',
							'category',
							'icon',
							'stability',
							'instability',
							'modifiers',
							'active',
							'conditions',
							'children',
							'weight',
						],
					},
				],
			});

			if (!userUpgrade) {
				throw ApiError.NotFound('User upgrade not found');
			}

			return userUpgrade;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to get user upgrade: ${err.message}`
			);
		}
	}

	/**
	 * Get all available upgrades for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Array>} Available upgrades
	 */
	async getAvailableUpgrades(userId) {
		try {
			// Get all active upgrade nodes
			const upgradeNodes = await UpgradeNodeTemplate.findAll({
				where: {
					active: true,
				},
			});

			// Get all user upgrades
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
			});

			// Create a map of user upgrades for quick lookup
			const userUpgradeMap = {};
			userUpgrades.forEach((upgrade) => {
				userUpgradeMap[upgrade.upgradeNodeTemplateId] = upgrade;
			});

			// Filter upgrade nodes based on availability
			const availableUpgrades = upgradeNodes.filter((node) => {
				// If the user already has this upgrade, it's available
				if (userUpgradeMap[node.id]) {
					return true;
				}

				// Check if the upgrade has any conditions
				if (
					node.conditions &&
					Object.keys(node.conditions).length > 0
				) {
					// Check if the upgrade requires parent upgrades
					if (
						node.conditions.parents &&
						Array.isArray(node.conditions.parents)
					) {
						// Check if all parent upgrades are completed
						for (const parentId of node.conditions.parents) {
							const parentUpgrade = userUpgradeMap[parentId];
							if (
								!parentUpgrade ||
								!parentUpgrade.completed ||
								parentUpgrade.level <
									node.conditions.parentLevel
							) {
								return false;
							}
						}
					}

					// Add more condition checks here as needed
				}

				// If no conditions or all conditions are met, the upgrade is available
				return true;
			});

			// Map available upgrades to include user progress if exists
			return availableUpgrades.map((node) => {
				const userUpgrade = userUpgradeMap[node.id];
				if (userUpgrade) {
					return {
						...node.toJSON(),
						userProgress: {
							level: userUpgrade.level,
							progress: userUpgrade.progress,
							targetProgress: userUpgrade.targetProgress,
							completed: userUpgrade.completed,
							stability: userUpgrade.stability,
							instability: userUpgrade.instability,
						},
					};
				} else {
					return {
						...node.toJSON(),
						userProgress: {
							level: 0,
							progress: 0,
							targetProgress: 100,
							completed: false,
							stability: 0,
							instability: 0,
						},
					};
				}
			});
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get available upgrades: ${err.message}`
			);
		}
	}

	/**
	 * Purchase an upgrade for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Upgrade node ID
	 * @returns {Promise<Object>} Updated user upgrade
	 */
	async purchaseUpgrade(userId, slug) {
		const t = await sequelize.transaction();

		try {
			// Get the upgrade node
			const upgradeNode = await UpgradeNodeTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!upgradeNode) {
				await t.rollback();
				throw ApiError.NotFound('Upgrade not found');
			}

			if (!upgradeNode.active) {
				await t.rollback();
				throw ApiError.BadRequest('Upgrade is not active');
			}

			// Check if the user already has this upgrade
			let userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					upgradeNodeTemplateId: upgradeNode.id,
				},
				transaction: t,
			});

			// Get user state for resource check
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				await t.rollback();
				throw ApiError.NotFound('User state not found');
			}

			// Calculate the price based on the current level
			const currentLevel = userUpgrade ? userUpgrade.level : 0;

			// Check if the upgrade is already at max level
			if (currentLevel >= upgradeNode.maxLevel) {
				await t.rollback();
				throw ApiError.BadRequest('Upgrade already at max level');
			}

			const price = this.calculateUpgradePrice(
				upgradeNode.basePrice,
				currentLevel,
				upgradeNode.priceMultiplier
			);

			// Check if the user has enough resources
			const resourceField = upgradeNode.resource;
			if (userState[resourceField] < price) {
				await t.rollback();
				throw ApiError.BadRequest(
					`Not enough ${resourceField} to purchase upgrade`
				);
			}

			// Deduct the resources
			userState[resourceField] -= price;
			await userState.save({ transaction: t });

			// Create or update the user upgrade
			if (!userUpgrade) {
				userUpgrade = await UserUpgrade.create(
					{
						userId,
						upgradeNodeTemplateId: upgradeNode.id,
						level: 1,
						progress: 0,
						targetProgress: 100,
						completed: false,
						stability: upgradeNode.stability || 0,
						instability: upgradeNode.instability || 0,
						progressHistory: [
							{
								timestamp: Date.now(),
								progress: 0,
								level: 1,
							},
						],
						lastProgressUpdate: new Date(),
					},
					{ transaction: t }
				);
			} else {
				// Increment the level
				userUpgrade.level += 1;

				// Reset progress if not at max level
				if (userUpgrade.level < upgradeNode.maxLevel) {
					userUpgrade.progress = 0;
					userUpgrade.completed = false;
				} else {
					userUpgrade.progress = userUpgrade.targetProgress;
					userUpgrade.completed = true;
				}

				// Update progress history
				userUpgrade.progressHistory = [
					...(userUpgrade.progressHistory || []),
					{
						timestamp: Date.now(),
						progress: userUpgrade.progress,
						level: userUpgrade.level,
					},
				];

				userUpgrade.lastProgressUpdate = new Date();

				await userUpgrade.save({ transaction: t });
			}

			// Unlock child upgrades if this upgrade is completed
			if (
				userUpgrade.completed &&
				upgradeNode.children &&
				upgradeNode.children.length > 0
			) {
				// This could involve marking child upgrades as available
				// or creating entries for them in the user_upgrades table
				// Implementation depends on how availability is tracked
			}

			await t.commit();

			// Return the updated user upgrade with the upgrade node
			return {
				...userUpgrade.toJSON(),
				upgradeNode: upgradeNode.toJSON(),
				resourcesSpent: price,
			};
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to purchase upgrade: ${err.message}`
			);
		}
	}

	/**
	 * Update progress for a user upgrade
	 * @param {number} userId - User ID
	 * @param {string} slug - Upgrade node ID
	 * @param {number} progress - New progress value
	 * @returns {Promise<Object>} Updated user upgrade
	 */
	async updateUpgradeProgress(userId, slug, progress) {
		const t = await sequelize.transaction();

		try {
			const upgradeNode = await UpgradeNodeTemplate.findOne({
				where: { slug },
			});
			if (!upgradeNode) {
				throw ApiError.NotFound('Upgrade node not found');
			}
			// Get the user upgrade
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					upgradeNodeTemplateId: upgradeNode.id,
				},
				include: [
					{
						model: UpgradeNodeTemplate,
					},
				],
				transaction: t,
			});

			if (!userUpgrade) {
				await t.rollback();
				throw ApiError.NotFound('User upgrade not found');
			}

			// If the upgrade is already completed, don't update progress
			if (userUpgrade.completed) {
				await t.rollback();
				return userUpgrade;
			}

			// Update progress
			userUpgrade.progress = Math.min(
				progress,
				userUpgrade.targetProgress
			);

			// Check if the upgrade is now completed
			if (userUpgrade.progress >= userUpgrade.targetProgress) {
				userUpgrade.completed = true;

				// If at max level, mark as completed
				if (userUpgrade.level >= userUpgrade.upgradenode.maxLevel) {
					userUpgrade.completed = true;
				} else {
					// Otherwise, prepare for next level
					userUpgrade.progress = 0;
					userUpgrade.level += 1;
					userUpgrade.completed = false;
				}
			}

			// Update progress history
			userUpgrade.progressHistory = [
				...(userUpgrade.progressHistory || []),
				{
					timestamp: Date.now(),
					progress: userUpgrade.progress,
					level: userUpgrade.level,
				},
			];

			userUpgrade.lastProgressUpdate = new Date();

			await userUpgrade.save({ transaction: t });
			await t.commit();

			return userUpgrade;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to update upgrade progress: ${err.message}`
			);
		}
	}

	/**
	 * Calculate the price of an upgrade based on level
	 * @param {number} basePrice - Base price of the upgrade
	 * @param {number} currentLevel - Current level of the upgrade
	 * @param {number} priceMultiplier - Price multiplier for each level
	 * @returns {number} Calculated price
	 */
	calculateUpgradePrice(basePrice, currentLevel, priceMultiplier) {
		return Math.floor(basePrice * Math.pow(priceMultiplier, currentLevel));
	}

	/**
	 * Get upgrade statistics for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} Upgrade statistics
	 */
	async getUpgradeStats(userId) {
		try {
			// Get all user upgrades
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				include: [
					{
						model: UpgradeNode,
						attributes: ['category', 'resource'],
					},
				],
			});

			// Get all upgrade nodes to calculate total available
			const allUpgradeNodes = await UpgradeNode.findAll({
				where: { active: true },
			});

			// Calculate statistics
			const stats = {
				total: userUpgrades.length,
				completed: userUpgrades.filter((u) => u.completed).length,
				inProgress: userUpgrades.filter((u) => !u.completed).length,
				totalAvailable: allUpgradeNodes.length,
				byCategory: {},
				byResource: {},
				totalLevels: 0,
				totalMaxLevels: 0,
			};

			// Calculate by category and resource
			userUpgrades.forEach((upgrade) => {
				const category = upgrade.upgradenode?.category || 'unknown';
				const resource = upgrade.upgradenode?.resource || 'unknown';

				// Count by category
				if (!stats.byCategory[category]) {
					stats.byCategory[category] = {
						total: 0,
						completed: 0,
						inProgress: 0,
					};
				}
				stats.byCategory[category].total++;
				if (upgrade.completed) {
					stats.byCategory[category].completed++;
				} else {
					stats.byCategory[category].inProgress++;
				}

				// Count by resource
				if (!stats.byResource[resource]) {
					stats.byResource[resource] = {
						total: 0,
						completed: 0,
						inProgress: 0,
					};
				}
				stats.byResource[resource].total++;
				if (upgrade.completed) {
					stats.byResource[resource].completed++;
				} else {
					stats.byResource[resource].inProgress++;
				}

				// Count levels
				stats.totalLevels += upgrade.level;
				stats.totalMaxLevels += upgrade.upgradenode?.maxLevel || 0;
			});

			// Calculate completion percentage
			stats.completionPercentage =
				stats.total > 0
					? Math.floor((stats.completed / stats.total) * 100)
					: 0;

			// Calculate level completion percentage
			stats.levelCompletionPercentage =
				stats.totalMaxLevels > 0
					? Math.floor(
							(stats.totalLevels / stats.totalMaxLevels) * 100
					  )
					: 0;

			return stats;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get upgrade stats: ${err.message}`
			);
		}
	}

	/**
	 * Reset all upgrades for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} Result of the reset operation
	 */
	async resetUpgrades(userId) {
		const t = await sequelize.transaction();

		try {
			// Delete all user upgrades
			await UserUpgrade.destroy({
				where: { userId },
				transaction: t,
			});

			// Optionally, refund resources
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState) {
				// You could implement resource refund logic here
				await userState.save({ transaction: t });
			}

			await t.commit();
			return {
				success: true,
				message: 'All upgrades reset successfully',
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to reset upgrades: ${err.message}`);
		}
	}
}

module.exports = new UpgradeService();
