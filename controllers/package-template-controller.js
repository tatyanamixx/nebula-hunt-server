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
			const templates = await packageTemplateService.getAllTemplates();
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
			const { slug } = req.params;

			const template = await packageTemplateService.getTemplateBySlug(
				slug
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
	async createPackageTemplates(req, res, next) {
		try {
			const templateData = req.body;

			const templates = await packageTemplateService.createTemplates(
				templateData
			);

			res.status(201).json(templates);
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
			const templateData = req.body;

			const template = await packageTemplateService.updateTemplate(
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
			const { slug } = req.params;

			const result = await packageTemplateService.deleteTemplate(slug);

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
	async togglePackageTemplateStatus(req, res, next) {
		try {
			const { slug } = req.params;

			const template = await packageTemplateService.toggleTemplateStatus(
				slug
			);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new PackageTemplateController();
