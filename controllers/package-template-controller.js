/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * updated by Claude on 15.07.2025
 */
const packageTemplateService = require("../service/package-template-service");
const { SYSTEM_USER_ID } = require("../config/constants");
const ApiError = require("../exceptions/api-error");

class PackageTemplateController {
	/**
	 * Get active store packages for client (public endpoint)
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getStorePackages(req, res, next) {
		try {
			const templates = await packageTemplateService.getAllTemplates();

			// Return only active templates for store
			const activeTemplates = templates.filter(
				(template) => template.status === true
			);

			console.log(
				"🔍 Package templates from database:",
				activeTemplates.map((t) => ({
					slug: t.slug,
					labelKey: t.labelKey,
					category: t.category,
					actionType: t.actionType,
				}))
			);

			// Transform to client format with new structure support
			const storePackages = activeTemplates.map((template) => ({
				id: template.slug,
				// Новые поля для гибкой структуры
				category: template.category,
				action: {
					type: template.actionType,
					target: template.actionTarget,
					reward: template.actionData,
					cost: template.costData,
				},
				labelKey: template.labelKey,
				icon: template.icon,
				name: template.name,
				description: template.description,
				status: template.status,
				sortOrder: template.sortOrder,
				isPromoted: template.isPromoted,
			}));

			console.log(
				"📦 Transformed packages for client:",
				storePackages.map((p) => ({
					id: p.id,
					labelKey: p.labelKey,
					category: p.category,
					actionType: p.action.type,
				}))
			);

			res.json({
				success: true,
				data: storePackages,
			});
		} catch (e) {
			next(e);
		}
	}

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

			const template = await packageTemplateService.getTemplateBySlug(slug);

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

			const template = await packageTemplateService.toggleTemplateStatus(slug);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new PackageTemplateController();
