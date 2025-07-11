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
	async createUpgradeTemplate(req, res, next) {
		try {
			const nodeData = req.body;
			if (!nodeData) {
				return next(
					ApiError.BadRequest('Invalid request: node data required')
				);
			}

			const result = await upgradeTemplateService.createUpgradeNode(
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
	async updateUpgradeTemplate(req, res, next) {
		try {
			const { upgradeId } = req.params;
			const nodeData = req.body;

			if (!upgradeId) {
				return next(ApiError.BadRequest('Upgrade ID is required'));
			}

			if (!nodeData) {
				return next(ApiError.BadRequest('Node data is required'));
			}

			const node = await upgradeTemplateService.updateUpgradeNode(
				upgradeId,
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
	async deleteUpgradeTemplate(req, res, next) {
		try {
			const { upgradeId } = req.params;

			if (!upgradeId) {
				return next(ApiError.BadRequest('Upgrade ID is required'));
			}

			const result = await upgradeTemplateService.deleteUpgradeNode(
				upgradeId
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
	async getAllUpgradeTemplates(req, res, next) {
		try {
			const nodes = await upgradeTemplateService.getAllUpgradeNodes();
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
	async getUpgradeTemplate(req, res, next) {
		try {
			const { upgradeId } = req.params;

			if (!upgradeId) {
				return next(ApiError.BadRequest('Upgrade ID is required'));
			}

			const node = await upgradeTemplateService.getUpgradeNode(upgradeId);
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
	async activateUpgradeTemplate(req, res, next) {
		try {
			const { upgradeId } = req.params;

			if (!upgradeId) {
				return next(ApiError.BadRequest('Upgrade ID is required'));
			}

			const node = await upgradeTemplateService.setUpgradeNodeStatus(
				upgradeId,
				true
			);
			return res.json(node);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Deactivate an upgrade template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async deactivateUpgradeTemplate(req, res, next) {
		try {
			const { upgradeId } = req.params;

			if (!upgradeId) {
				return next(ApiError.BadRequest('Upgrade ID is required'));
			}

			const node = await upgradeTemplateService.setUpgradeNodeStatus(
				upgradeId,
				false
			);
			return res.json(node);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UpgradeTemplateController();
