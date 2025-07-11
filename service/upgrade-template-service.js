/**
 * created by Claude on 15.07.2025
 */
const { UpgradeNode } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');

class UpgradeTemplateService {
	/**
	 * Create or update multiple upgrade templates
	 * @param {Array} nodes - Array of upgrade node data
	 * @returns {Promise<Array>} Created or updated upgrade nodes
	 */
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

				// Try to find existing node with the same ID
				let existingNode = await UpgradeNode.findByPk(node.id, {
					transaction: t,
				});

				if (existingNode) {
					// Update existing node
					await existingNode.update(node, { transaction: t });
					createdNodes.push(existingNode);
				} else {
					// Create new node
					const newNode = await UpgradeNode.create(node, {
						transaction: t,
					});
					createdNodes.push(newNode);
				}
			}

			await t.commit();
			return createdNodes;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to create upgrade nodes: ${err.message}`
			);
		}
	}

	/**
	 * Update an upgrade template
	 * @param {string} nodeId - Upgrade node ID
	 * @param {Object} nodeData - Upgrade node data
	 * @returns {Promise<Object>} Updated upgrade node
	 */
	async updateUpgradeNode(nodeId, nodeData) {
		const t = await sequelize.transaction();

		try {
			// Find the node by ID
			const node = await UpgradeNode.findByPk(nodeId, { transaction: t });

			if (!node) {
				await t.rollback();
				throw ApiError.NotFound('Upgrade node not found');
			}

			// Update node data
			await node.update(nodeData, { transaction: t });

			await t.commit();
			return node;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest(
				'Failed to update upgrade node: ' + err.message
			);
		}
	}

	/**
	 * Delete an upgrade template
	 * @param {string} nodeId - Upgrade node ID
	 * @returns {Promise<Object>} Result of deletion
	 */
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
			return { message: 'Upgrade node deleted successfully', id: nodeId };
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest(
				'Failed to delete upgrade node: ' + err.message
			);
		}
	}

	/**
	 * Get all upgrade templates
	 * @returns {Promise<Array>} All upgrade nodes
	 */
	async getAllUpgradeNodes() {
		try {
			const nodes = await UpgradeNode.findAll({
				order: [['id', 'ASC']],
			});
			return nodes;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get upgrade nodes: ${err.message}`
			);
		}
	}

	/**
	 * Get a specific upgrade template
	 * @param {string} nodeId - Upgrade node ID
	 * @returns {Promise<Object>} Upgrade node
	 */
	async getUpgradeNode(nodeId) {
		try {
			const node = await UpgradeNode.findByPk(nodeId);

			if (!node) {
				throw ApiError.NotFound('Upgrade node not found');
			}

			return node;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to get upgrade node: ${err.message}`
			);
		}
	}

	/**
	 * Toggle upgrade template active status
	 * @param {string} nodeId - Upgrade node ID
	 * @returns {Promise<Object>} Updated upgrade node
	 */
	async toggleUpgradeNodeActive(nodeId) {
		const t = await sequelize.transaction();

		try {
			const node = await UpgradeNode.findByPk(nodeId, { transaction: t });

			if (!node) {
				await t.rollback();
				throw ApiError.NotFound('Upgrade node not found');
			}

			node.active = !node.active;
			await node.save({ transaction: t });

			await t.commit();
			return node;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to toggle upgrade node status: ${err.message}`
			);
		}
	}

	/**
	 * Get upgrade template statistics
	 * @returns {Promise<Object>} Upgrade statistics
	 */
	async getUpgradeNodesStats() {
		try {
			const totalNodes = await UpgradeNode.count();
			const activeNodes = await UpgradeNode.count({
				where: { active: true },
			});
			const inactiveNodes = totalNodes - activeNodes;

			// Count by category
			const categories = await UpgradeNode.findAll({
				attributes: [
					'category',
					[sequelize.fn('COUNT', sequelize.col('id')), 'count'],
				],
				group: ['category'],
			});

			const categoryStats = {};
			categories.forEach((category) => {
				categoryStats[category.category] = category.dataValues.count;
			});

			// Count by resource
			const resources = await UpgradeNode.findAll({
				attributes: [
					'resource',
					[sequelize.fn('COUNT', sequelize.col('id')), 'count'],
				],
				group: ['resource'],
			});

			const resourceStats = {};
			resources.forEach((resource) => {
				resourceStats[resource.resource] = resource.dataValues.count;
			});

			return {
				total: totalNodes,
				active: activeNodes,
				inactive: inactiveNodes,
				byCategory: categoryStats,
				byResource: resourceStats,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get upgrade nodes stats: ${err.message}`
			);
		}
	}
}

module.exports = new UpgradeTemplateService();
