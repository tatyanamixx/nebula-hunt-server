/**
 * created by Claude on 15.07.2025
 */
const { UpgradeNodeTemplate } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const sequelize = require('../db');
const { Op } = require('sequelize');
const logger = require('./logger-service');

class UpgradeTemplateService {
	/**
	 * Create or update multiple upgrade templates
	 * @param {Array} nodes - Array of upgrade node data
	 * @returns {Promise<Array>} Created or updated upgrade nodes
	 */
	async createUpgradeNodeTemplates(nodes) {
		const t = await sequelize.transaction();

		try {
			logger.debug('createUpgradeNodeTemplates on start', {
				nodesCount: nodes.length,
			});
			const createdNodes = [];
			for (const node of nodes) {
				// Validate node data
				if (!node.slug || !node.name || !node.description) {
					logger.debug('Invalid upgrade node data structure', {
						node,
					});
					throw ApiError.BadRequest(
						'Invalid upgrade node data structure',
						ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
					);
				}

				// Validate description structure
				if (!node.description.en || !node.description.ru) {
					logger.debug('Invalid description structure', { node });
					throw ApiError.BadRequest(
						'Description must contain both "en" and "ru" translations',
						ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
					);
				}

				// Clean node data - remove id, createdAt, updatedAt to avoid conflicts
				const { id, createdAt, updatedAt, ...cleanNodeData } = node;

				// Use findOrCreate to handle both creation and updates
				const [upgradeNode, created] =
					await UpgradeNodeTemplate.findOrCreate({
						where: { slug: node.slug },
						defaults: cleanNodeData,
						transaction: t,
					});

				// If node already exists, update it
				if (!created) {
					await upgradeNode.update(cleanNodeData, { transaction: t });
				}

				createdNodes.push(upgradeNode);
			}

			await t.commit();

			// Convert BigInt to regular numbers for JSON serialization
			const serializedNodes = createdNodes.map((node) => {
				const nodeData = node.toJSON();
				if (nodeData.id && typeof nodeData.id === 'bigint') {
					nodeData.id = Number(nodeData.id);
				}
				return nodeData;
			});

			logger.debug('createUpgradeNodeTemplates completed successfully', {
				createdCount: serializedNodes.length,
			});
			return serializedNodes;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to create upgrade node templates', {
				nodesCount: nodes.length,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to create upgrade nodes: ${err.message}`,
				ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Update an upgrade template
	 * @param {string} slug - Upgrade node ID
	 * @param {Object} nodeData - Upgrade node data
	 * @returns {Promise<Object>} Updated upgrade node
	 */
	async updateUpgradeNodeTemplate(nodeData) {
		const t = await sequelize.transaction();

		try {
			logger.debug('updateUpgradeNodeTemplate on start', {
				slug: nodeData.slug,
			});
			// Find the node by ID
			const node = await UpgradeNodeTemplate.findOne({
				where: { slug: nodeData.slug },
				transaction: t,
			});

			if (!node) {
				await t.rollback();
				logger.debug('Upgrade node template not found for update', {
					slug: nodeData.slug,
				});
				throw ApiError.NotFound(
					`Upgrade node template not found: ${nodeData.slug}`,
					ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
				);
			}

			// Update node data
			await node.update(nodeData, { transaction: t });

			await t.commit();

			// Convert BigInt to regular numbers for JSON serialization
			const nodeDataSerialized = node.toJSON();
			if (
				nodeDataSerialized.id &&
				typeof nodeDataSerialized.id === 'bigint'
			) {
				nodeDataSerialized.id = Number(nodeDataSerialized.id);
			}

			logger.debug('updateUpgradeNodeTemplate completed successfully', {
				slug: nodeData.slug,
			});
			return nodeDataSerialized;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to update upgrade node template', {
				slug: nodeData.slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest(
				`Failed to update upgrade node: ${err.message}`,
				ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Delete an upgrade template
	 * @param {string} slug - Upgrade node ID
	 * @returns {Promise<Object>} Result of deletion
	 */
	async deleteUpgradeNodeTemplate(slug) {
		const t = await sequelize.transaction();

		try {
			logger.debug('deleteUpgradeNodeTemplate on start', { slug });
			const node = await UpgradeNodeTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!node) {
				await t.rollback();
				logger.debug('Upgrade node template not found for deletion', {
					slug,
				});
				throw ApiError.NotFound(
					`Upgrade node template not found: ${slug}`,
					ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
				);
			}

			await node.destroy({ transaction: t });

			await t.commit();

			logger.debug('deleteUpgradeNodeTemplate completed successfully', {
				slug,
			});
			return { message: 'Upgrade node deleted successfully', slug: slug };
		} catch (err) {
			await t.rollback();

			logger.error('Failed to delete upgrade node template', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest(
				`Failed to delete upgrade node: ${err.message}`,
				ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get all upgrade templates
	 * @returns {Promise<Array>} All upgrade nodes
	 */
	async getAllUpgradeNodeTemplates() {
		try {
			logger.debug('getAllUpgradeNodeTemplates on start');
			const nodes = await UpgradeNodeTemplate.findAll({
				order: [['slug', 'ASC']],
			});

			// Convert BigInt to regular numbers for JSON serialization
			const serializedNodes = nodes.map((node) => {
				const nodeData = node.toJSON();
				if (nodeData.id && typeof nodeData.id === 'bigint') {
					nodeData.id = Number(nodeData.id);
				}
				return nodeData;
			});

			logger.debug('getAllUpgradeNodeTemplates completed successfully', {
				count: serializedNodes.length,
			});
			return serializedNodes;
		} catch (err) {
			logger.error('Failed to get all upgrade node templates', {
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get upgrade nodes: ${err.message}`,
				ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get a specific upgrade template
	 * @param {string} slug - Upgrade node ID
	 * @returns {Promise<Object>} Upgrade node
	 */
	async getUpgradeNodeTemplate(slug) {
		try {
			logger.debug('getUpgradeNodeTemplate on start', { slug });
			const node = await UpgradeNodeTemplate.findOne({
				where: { slug },
			});

			if (!node) {
				logger.debug('Upgrade node template not found', { slug });
				throw ApiError.NotFound(
					`Upgrade node template not found: ${slug}`,
					ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
				);
			}

			// Convert BigInt to regular numbers for JSON serialization
			const nodeData = node.toJSON();
			if (nodeData.id && typeof nodeData.id === 'bigint') {
				nodeData.id = Number(nodeData.id);
			}

			logger.debug('getUpgradeNodeTemplate completed successfully', {
				slug,
			});
			return nodeData;
		} catch (err) {
			logger.error('Failed to get upgrade node template', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to get upgrade node: ${err.message}`,
				ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Toggle upgrade template active status
	 * @param {string} slug - Upgrade node ID
	 * @returns {Promise<Object>} Updated upgrade node
	 */
	async toggleUpgradeNodeTemplateActive(slug) {
		const t = await sequelize.transaction();

		try {
			logger.debug('toggleUpgradeNodeTemplateActive on start', { slug });
			const node = await UpgradeNodeTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!node) {
				await t.rollback();
				logger.debug(
					'Upgrade node template not found for status toggle',
					{ slug }
				);
				throw ApiError.NotFound(
					`Upgrade node template not found: ${slug}`,
					ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
				);
			}

			node.active = !node.active;
			await node.save({ transaction: t });

			await t.commit();

			// Convert BigInt to regular numbers for JSON serialization
			const nodeDataSerialized = node.toJSON();
			if (
				nodeDataSerialized.id &&
				typeof nodeDataSerialized.id === 'bigint'
			) {
				nodeDataSerialized.id = Number(nodeDataSerialized.id);
			}

			logger.debug(
				'toggleUpgradeNodeTemplateActive completed successfully',
				{
					slug,
					newActiveStatus: node.active,
				}
			);
			return nodeDataSerialized;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to toggle upgrade node template status', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to toggle upgrade node status: ${err.message}`,
				ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get upgrade template statistics
	 * @returns {Promise<Object>} Upgrade statistics
	 */
	async getUpgradeNodeTemplatesStats() {
		try {
			logger.debug('getUpgradeNodeTemplatesStats on start');
			const totalNodes = await UpgradeNodeTemplate.count();
			const activeNodes = await UpgradeNodeTemplate.count({
				where: { active: true },
			});
			const inactiveNodes = totalNodes - activeNodes;

			// Count by category
			const categories = await UpgradeNodeTemplate.findAll({
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
			const resources = await UpgradeNodeTemplate.findAll({
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

			const result = {
				total: totalNodes,
				active: activeNodes,
				inactive: inactiveNodes,
				byCategory: categoryStats,
				byResource: resourceStats,
			};

			logger.debug(
				'getUpgradeNodeTemplatesStats completed successfully',
				{
					total: totalNodes,
					active: activeNodes,
				}
			);
			return result;
		} catch (err) {
			logger.error('Failed to get upgrade node templates stats', {
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get upgrade nodes stats: ${err.message}`,
				ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
			);
		}
	}
}

module.exports = new UpgradeTemplateService();
