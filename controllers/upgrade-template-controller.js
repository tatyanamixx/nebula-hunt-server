/**
 * created by Claude on 15.07.2025
 */
const upgradeTemplateService = require('../service/upgrade-template-service');
const ApiError = require('../exceptions/api-error');

class UpgradeTemplateController {
	/**
	 * Create a new upgrade template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async createUpgradeTemplates(req, res, next) {
		try {
			const nodeData = req.body;
			if (!nodeData) {
				return next(
					ApiError.BadRequest('Invalid request: node data required')
				);
			}

			const result = await upgradeTemplateService.createUpgradeNodeTemplates(
				nodeData
			);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Update an upgrade template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async updateUpgradeNodeTemplate(req, res, next) {
		try {
			const nodeData = req.body;

			if (!nodeData) {
				return next(ApiError.BadRequest('Node data is required'));
			}

			const node = await upgradeTemplateService.updateUpgradeNodeTemplate(
				nodeData
			);
			return res.json(node);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Delete an upgrade template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async deleteUpgradeNodeTemplate(req, res, next) {
		try {
			const { slug } = req.params;

			const result = await upgradeTemplateService.deleteUpgradeNodeTemplate(
				slug
			);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get all upgrade templates
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getAllUpgradeNodeTemplates(req, res, next) {
		try {
			const nodes = await upgradeTemplateService.getAllUpgradeNodeTemplates();
			return res.json(nodes);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get a specific upgrade template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getUpgradeNodeTemplate(req, res, next) {
		try {
			const { slug } = req.params;

			const node = await upgradeTemplateService.getUpgradeNodeTemplate(slug);
			return res.json(node);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Activate an upgrade template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async toggleUpgradeNodeTemplateActive(req, res, next) {
		try {
			const { slug } = req.params;

			const node = await upgradeTemplateService.toggleUpgradeNodeTemplateActive(
				slug
			);
			return res.json(node);
		} catch (e) {
			next(e);
		}
	}

	async getUpgradeNodeTemplatesStats(req, res, next) {
		try {
			const stats = await upgradeTemplateService.getUpgradeNodeTemplatesStats();
			return res.json(stats);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UpgradeTemplateController();
