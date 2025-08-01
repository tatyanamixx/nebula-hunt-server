const commissionTemplateService = require('../service/commission-template-service.js');
const ApiError = require('../exceptions/api-error.js');

/**
 * Create commission templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function createCommissionTemplates(req, res, next) {
	try {
		const templates = req.body;
		const result =
			await commissionTemplateService.createCommissionTemplates(
				templates
			);
		res.status(201).json({
			success: true,
			message: 'Commission templates created successfully',
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Get all commission templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getAllCommissionTemplates(req, res, next) {
	try {
		const templates =
			await commissionTemplateService.getAllCommissionTemplates();
		res.json({
			success: true,
			data: templates,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Get a specific commission template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getCommissionTemplate(req, res, next) {
	try {
		const { currency } = req.params;
		const template = await commissionTemplateService.getCommissionTemplate(
			currency
		);
		res.json({
			success: true,
			data: template,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Update a commission template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function updateCommissionTemplate(req, res, next) {
	try {
		const templateData = req.body;
		const result = await commissionTemplateService.updateCommissionTemplate(
			templateData
		);
		res.json({
			success: true,
			message: 'Commission template updated successfully',
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Delete a commission template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function deleteCommissionTemplate(req, res, next) {
	try {
		const { currency } = req.params;
		const result = await commissionTemplateService.deleteCommissionTemplate(
			currency
		);
		res.json({
			success: true,
			message: result.message,
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Get commission templates statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getCommissionTemplatesStats(req, res, next) {
	try {
		const stats =
			await commissionTemplateService.getCommissionTemplatesStats();
		res.json({
			success: true,
			data: stats,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createCommissionTemplates,
	getAllCommissionTemplates,
	getCommissionTemplate,
	updateCommissionTemplate,
	deleteCommissionTemplate,
	getCommissionTemplatesStats,
};
