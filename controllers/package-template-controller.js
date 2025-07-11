/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const packageTemplateService = require('../service/package-template-service');
const { SYSTEM_USER_ID } = require('../config/constants');
const ApiError = require('../exceptions/api-error');

class PackageTemplateController {
	/**
	 * Get all package templates
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getAllPackageTemplates(req, res, next) {
		try {
			const { category, sortBy, sortDir } = req.query;

			const templates = await packageTemplateService.getAllTemplates({
				category,
				sortBy,
				sortDir,
			});

			res.json(templates);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get package template by ID
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getPackageTemplate(req, res, next) {
		try {
			const { packageId } = req.params;

			const template = await packageTemplateService.getTemplateById(
				packageId
			);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Create a new package template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async createPackageTemplate(req, res, next) {
		try {
			const templateData = req.body;

			const template = await packageTemplateService.createTemplate(
				templateData
			);

			res.status(201).json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Update a package template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async updatePackageTemplate(req, res, next) {
		try {
			const { packageId } = req.params;
			const templateData = req.body;

			const template = await packageTemplateService.updateTemplate(
				packageId,
				templateData
			);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Delete a package template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async deletePackageTemplate(req, res, next) {
		try {
			const { packageId } = req.params;

			const result = await packageTemplateService.deleteTemplate(
				packageId
			);

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Activate a package template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async activatePackageTemplate(req, res, next) {
		try {
			const { packageId } = req.params;

			const template = await packageTemplateService.changeTemplateStatus(
				packageId,
				'ACTIVE'
			);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Deactivate a package template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async deactivatePackageTemplate(req, res, next) {
		try {
			const { packageId } = req.params;

			const template = await packageTemplateService.changeTemplateStatus(
				packageId,
				'INACTIVE'
			);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new PackageTemplateController();
