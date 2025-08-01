/**
 * created by Claude on 15.07.2025
 */
const {
	UpgradeNodeTemplate,
	UserUpgrade,
	UserState,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const sequelize = require('../db');
const { Op } = require('sequelize');
const logger = require('./logger-service');

class UpgradeService {
	/**
	 * Initialize and activate upgrade tree for a user with deactivation check
	 * @param {number} userId - User ID
	 * @param {Object} transaction - Optional transaction object
	 * @returns {Promise<Object>} Result with initialized and activated upgrades
	 */
	async initializeUserUpgradeTree(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		logger.debug('initializeUserUpgradeTree on start', { userId });

		try {
			const result = {
				initialized: [],
				activated: [],
				total: 0,
			};

			// Get existing user upgrades first
			const existingUpgrades = await UserUpgrade.findAll({
				where: { userId },
				transaction: t,
			});

			if (existingUpgrades.length === 0) {
				logger.debug(
					'No existing user upgrades found, creating new ones'
				);

				// Get all active upgrade nodes for new user
				const upgradeNodes = await UpgradeNodeTemplate.findAll({
					where: { active: true },
					transaction: t,
				});

				if (upgradeNodes.length === 0) {
					logger.debug('No active upgrade nodes found');
					if (shouldCommit && !t.finished) {
						await t.commit();
					}
					return result;
				}

				// Process each upgrade node for new user
				for (const node of upgradeNodes) {
					try {
						// Check if node should be available (root node or parent requirements met)
						let shouldActivate = false;

						// Root nodes (no parent requirements) are always available
						if (
							!node.conditions ||
							!node.conditions.parents ||
							!Array.isArray(node.conditions.parents) ||
							node.conditions.parents.length === 0
						) {
							shouldActivate = true;
							logger.debug('Root node found', {
								userId,
								upgradeNodeTemplateId: node.id,
								nodeSlug: node.slug,
							});
						} else {
							// For new users, parent requirements are not checked initially
							shouldActivate = false;
						}

						if (shouldActivate) {
							// Use findOrCreate to avoid duplicates
							const [userUpgrade, created] =
								await UserUpgrade.findOrCreate({
									where: {
										userId,
										upgradeNodeTemplateId: node.id,
									},
									defaults: {
										userId,
										upgradeNodeTemplateId: node.id,
										level: 0,
										progress: 0,
										targetProgress: 100,
										completed: false,
										progressHistory: [
											{
												level: 0,
												progress: 0,
												timestamp: Date.now(),
											},
										],
										lastProgressUpdate: new Date(),
										stability: node.stability || 0.1,
										instability: node.instability || 0.1,
									},
									transaction: t,
								});

							if (created) {
								logger.debug('Created new user upgrade', {
									userId,
									upgradeNodeTemplateId: node.id,
									nodeSlug: node.slug,
								});
							}

							result.initialized.push({
								...userUpgrade.toJSON(),
								slug: node.slug,
								template: node.toJSON(),
							});
						}
					} catch (upgradeError) {
						logger.error('Error creating user upgrade', {
							userId,
							upgradeNodeTemplateId: node.id,
							nodeSlug: node.slug,
							error: upgradeError.message,
						});
						throw ApiError.Internal(
							`Failed to create user upgrade for template ${node.slug}: ${upgradeError.message}`,
							ERROR_CODES.UPGRADE.UPGRADE_TEMPLATE_NOT_FOUND
						);
					}
				}
			} else {
				logger.debug(
					'Existing user upgrades found, checking template status'
				);

				// For existing users, check template status for each upgrade
				const upgradeTemplateIds = existingUpgrades.map(
					(upgrade) => upgrade.upgradeNodeTemplateId
				);

				// Get all templates (active and inactive) for existing upgrades
				const upgradeTemplates = await UpgradeNodeTemplate.findAll({
					where: { id: upgradeTemplateIds },
					transaction: t,
				});

				const templateMap = {};
				upgradeTemplates.forEach((template) => {
					templateMap[template.id] = template;
				});

				// Process existing upgrades and check if their templates are still active
				for (const userUpgrade of existingUpgrades) {
					const template =
						templateMap[userUpgrade.upgradeNodeTemplateId];

					if (!template) {
						logger.warn('Template not found for user upgrade', {
							userId,
							upgradeNodeTemplateId:
								userUpgrade.upgradeNodeTemplateId,
						});
						continue;
					}

					// Only include upgrades with active templates
					if (template.active) {
						if (
							!template.conditions ||
							!template.conditions.parents ||
							!Array.isArray(template.conditions.parents) ||
							template.conditions.parents.length === 0
						) {
							result.initialized.push({
								...userUpgrade.toJSON(),
								slug: template.slug,
								template: template.toJSON(),
							});
						} else {
							result.activated.push({
								...userUpgrade.toJSON(),
								slug: template.slug,
								template: template.toJSON(),
							});
						}
					} else {
						logger.debug('Skipping deactivated upgrade template', {
							userId,
							upgradeNodeTemplateId:
								userUpgrade.upgradeNodeTemplateId,
							templateSlug: template.slug,
						});
					}
				}
			}

			result.total = result.initialized.length + result.activated.length;

			logger.debug('initializeUserUpgradeTree completed successfully', {
				userId,
				initialized: result.initialized.length,
				activated: result.activated.length,
				total: result.total,
			});

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			return result;
		} catch (error) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			throw error;
		}
	}

	// ... остальные методы остаются без изменений
}

module.exports = new UpgradeService();
