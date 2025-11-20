/**
 * created by Claude on 15.07.2025
 */
const upgradeService = require("../service/upgrade-service");
const ApiError = require("../exceptions/api-error");
const logger = require("../service/logger-service");

class UpgradeController {
	/**
	 * Get a specific upgrade for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getUserUpgrade(req, res, next) {
		try {
			const userId = req.user.id;
			const { upgradeId } = req.params;

			if (!upgradeId) {
				return next(ApiError.BadRequest("Upgrade ID is required"));
			}

			const upgrade = await upgradeService.getUserUpgrade(userId, upgradeId);
			return res.json(upgrade);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get all upgrades for a user (existing, new, and available)
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getAvailableUpgrades(req, res, next) {
		try {
			const userId = req.user.id;
			const upgrades = await upgradeService.getAvailableUpgrades(userId);
			return res.json(upgrades);
		} catch (e) {
			logger.error("Upgrade Controller: getAvailableUpgrades error", {
				userId: req.user?.id,
				error: e.message,
			});
			next(e);
		}
	}

	/**
	 * Purchase an upgrade for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async purchaseUpgrade(req, res, next) {
		try {
			const userId = req.user.id;
			const { upgradeId } = req.params;

			if (!upgradeId) {
				return next(ApiError.BadRequest("Upgrade ID is required"));
			}

			const result = await upgradeService.purchaseUpgrade(userId, upgradeId);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Update progress for a user upgrade
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async updateUpgradeProgress(req, res, next) {
		try {
			const userId = req.user.id;
			const { upgradeId } = req.params;
			const { progress } = req.body;

			if (!upgradeId) {
				return next(ApiError.BadRequest("Upgrade ID is required"));
			}

			if (progress === undefined || progress === null) {
				return next(ApiError.BadRequest("Progress value is required"));
			}

			const result = await upgradeService.updateUpgradeProgress(
				userId,
				upgradeId,
				progress
			);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get upgrade statistics for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getUpgradeStats(req, res, next) {
		try {
			const userId = req.user.id;
			const stats = await upgradeService.getUpgradeStats(userId);
			return res.json(stats);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Reset all upgrades for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async resetUpgrades(req, res, next) {
		try {
			const userId = req.user.id;
			const result = await upgradeService.resetUpgrades(userId);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UpgradeController();
