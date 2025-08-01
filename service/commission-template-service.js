const { MarketCommission } = require('../models/models.js');
const { sequelize } = require('../models/index.js');
const ApiError = require('../exceptions/api-error.js');
const { ERROR_CODES } = require('../config/error-codes');
const logger = require('./logger-service');

class CommissionTemplateService {
	/**
	 * Create commission templates
	 * @param {Array} templates - Array of commission template data
	 * @returns {Promise<Array>} Created commission templates
	 */
	async createCommissionTemplates(templates) {
		const t = await sequelize.transaction();

		try {
			const createdTemplates = [];
			for (const template of templates) {
				// Validate template data
				if (!template.currency) {
					logger.debug(
						'Currency is required for commission template',
						{ template }
					);
					throw ApiError.BadRequest(
						'Currency is required for commission template',
						ERROR_CODES.COMMISSION.INVALID_COMMISSION_DATA
					);
				}

				// Clean template data - remove id, createdAt, updatedAt to avoid conflicts
				const { id, createdAt, updatedAt, ...cleanTemplateData } =
					template;

				// Use findOrCreate to handle both creation and updates
				const [commissionTemplate, created] =
					await MarketCommission.findOrCreate({
						where: { currency: template.currency },
						defaults: cleanTemplateData,
						transaction: t,
					});

				// If template already exists, update it
				if (!created) {
					await commissionTemplate.update(cleanTemplateData, {
						transaction: t,
					});
				}

				createdTemplates.push(commissionTemplate);
			}

			await t.commit();

			// Convert BigInt to regular numbers for JSON serialization
			const serializedTemplates = createdTemplates.map((template) => {
				const templateData = template.toJSON();
				if (templateData.id && typeof templateData.id === 'bigint') {
					templateData.id = Number(templateData.id);
				}
				return templateData;
			});

			return serializedTemplates;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to create commission templates', {
				templates: templates.length,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to create commission templates: ${err.message}`,
				ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Update a commission template
	 * @param {Object} templateData - Commission template data
	 * @returns {Promise<Object>} Updated commission template
	 */
	async updateCommissionTemplate(templateData) {
		const t = await sequelize.transaction();

		try {
			logger.debug('updateCommissionTemplate on start', {
				currency: templateData.currency,
			});

			// Find the template by currency
			const template = await MarketCommission.findOne({
				where: { currency: templateData.currency },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				logger.debug('Commission template not found for update', {
					currency: templateData.currency,
				});
				throw ApiError.NotFound(
					`Commission template not found: ${templateData.currency}`,
					ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
				);
			}

			// Update template data
			await template.update(templateData, { transaction: t });

			await t.commit();

			// Convert BigInt to regular numbers for JSON serialization
			const templateDataSerialized = template.toJSON();
			if (
				templateDataSerialized.id &&
				typeof templateDataSerialized.id === 'bigint'
			) {
				templateDataSerialized.id = Number(templateDataSerialized.id);
			}

			return templateDataSerialized;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to update commission template', {
				currency: templateData.currency,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to update commission template: ${err.message}`,
				ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Delete a commission template
	 * @param {string} currency - Commission template currency
	 * @returns {Promise<Object>} Deletion result
	 */
	async deleteCommissionTemplate(currency) {
		const t = await sequelize.transaction();

		try {
			logger.debug('deleteCommissionTemplate on start', { currency });

			const template = await MarketCommission.findOne({
				where: { currency },
				transaction: t,
			});

			if (!template) {
				logger.debug('Commission template not found for deletion', {
					currency,
				});
				throw ApiError.NotFound(
					`Commission template not found: ${currency}`,
					ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
				);
			}

			await template.destroy({ transaction: t });

			await t.commit();
			return {
				message: 'Commission template deleted successfully',
				currency: currency,
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to delete commission template', {
				currency,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.BadRequest(
				`Failed to delete commission template: ${err.message}`,
				ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get all commission templates
	 * @returns {Promise<Array>} All commission templates
	 */
	async getAllCommissionTemplates() {
		try {
			logger.debug('getAllCommissionTemplates on start');
			const templates = await MarketCommission.findAll({
				order: [['currency', 'ASC']],
			});

			// Convert BigInt to regular numbers for JSON serialization
			const serializedTemplates = templates.map((template) => {
				const templateData = template.toJSON();
				if (templateData.id && typeof templateData.id === 'bigint') {
					templateData.id = Number(templateData.id);
				}
				return templateData;
			});

			logger.debug('getAllCommissionTemplates completed successfully', {
				count: serializedTemplates.length,
			});
			return serializedTemplates;
		} catch (err) {
			logger.error('Failed to get all commission templates', {
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get commission templates: ${err.message}`,
				ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get a specific commission template
	 * @param {string} currency - Commission template currency
	 * @returns {Promise<Object>} Commission template
	 */
	async getCommissionTemplate(currency) {
		try {
			logger.debug('getCommissionTemplate on start', { currency });

			const template = await MarketCommission.findOne({
				where: { currency },
			});

			if (!template) {
				logger.debug('Commission template not found', { currency });
				throw ApiError.NotFound(
					`Commission template not found: ${currency}`,
					ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
				);
			}

			// Convert BigInt to regular numbers for JSON serialization
			const templateData = template.toJSON();
			if (templateData.id && typeof templateData.id === 'bigint') {
				templateData.id = Number(templateData.id);
			}

			logger.debug('getCommissionTemplate completed successfully', {
				currency,
			});
			return templateData;
		} catch (err) {
			logger.error('Failed to get commission template', {
				currency,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get commission template: ${err.message}`,
				ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get commission template statistics
	 * @returns {Promise<Object>} Commission statistics
	 */
	async getCommissionTemplatesStats() {
		try {
			logger.debug('getCommissionTemplatesStats on start');
			const totalTemplates = await MarketCommission.count();

			// Count by currency
			const currencies = await MarketCommission.findAll({
				attributes: [
					'currency',
					[sequelize.fn('COUNT', sequelize.col('id')), 'count'],
				],
				group: ['currency'],
			});

			const currencyStats = {};
			currencies.forEach((currency) => {
				currencyStats[currency.currency] = currency.dataValues.count;
			});

			// Get average rate
			const avgRate = await MarketCommission.findOne({
				attributes: [
					[sequelize.fn('AVG', sequelize.col('rate')), 'averageRate'],
				],
			});

			const result = {
				total: totalTemplates,
				byCurrency: currencyStats,
				averageRate: avgRate
					? parseFloat(avgRate.dataValues.averageRate)
					: 0,
			};

			logger.debug('getCommissionTemplatesStats completed successfully', {
				total: result.total,
			});
			return result;
		} catch (err) {
			logger.error('Failed to get commission templates stats', {
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get commission templates stats: ${err.message}`,
				ERROR_CODES.COMMISSION.COMMISSION_TEMPLATE_NOT_FOUND
			);
		}
	}
}

module.exports = new CommissionTemplateService();
