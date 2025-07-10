/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const upgradeService = require('../service/upgrade-service');
const ApiError = require('../exceptions/api-error');

class UpgradeController {
	async createUpgradeNodes(req, res, next) {
		try {
			const { nodes } = req.body;
			if (!nodes || !Array.isArray(nodes)) {
				return next(
					ApiError.BadRequest('Invalid request: nodes array required')
				);
			}

			const result = await upgradeService.createUpgradeNodes(nodes);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async updateUpgradeNode(req, res, next) {
		try {
			const { nodeId } = req.params;
			const nodeData = req.body;

			if (!nodeId) {
				return next(ApiError.BadRequest('Node ID is required'));
			}

			if (!nodeData) {
				return next(ApiError.BadRequest('Node data is required'));
			}

			const node = await upgradeService.updateUpgradeNode(
				nodeId,
				nodeData
			);
			return res.json(node);
		} catch (err) {
			next(err);
		}
	}

	async deleteUpgradeNode(req, res, next) {
		try {
			const { nodeId } = req.params;

			if (!nodeId) {
				return next(ApiError.BadRequest('Node ID is required'));
			}

			const result = await upgradeService.deleteUpgradeNode(nodeId);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getAllUpgradeNodes(req, res, next) {
		try {
			const nodes = await upgradeService.getAllUpgradeNodes();
			return res.json(nodes);
		} catch (err) {
			next(err);
		}
	}

	async getUserUpgradeNodes(req, res, next) {
		try {
			const userId = req.initdata.id;
			const nodes = await upgradeService.getUserUpgradeNodes(userId);
			return res.json(nodes);
		} catch (err) {
			next(err);
		}
	}

	async getUserUpgradeNode(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { nodeId } = req.params;

			if (!nodeId) {
				return next(ApiError.BadRequest('Node ID is required'));
			}

			const node = await upgradeService.getUserUpgradeNode(
				userId,
				nodeId
			);
			return res.json(node);
		} catch (err) {
			next(err);
		}
	}

	async completeUpgradeNode(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { nodeId } = req.body;

			if (!nodeId) {
				return next(ApiError.BadRequest('Node ID is required'));
			}

			const result = await upgradeService.completeUpgradeNode(
				userId,
				nodeId
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async updateUpgradeProgress(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { nodeId, progress } = req.body;

			if (!nodeId || progress === undefined) {
				return next(
					ApiError.BadRequest('Node ID and progress are required')
				);
			}

			const result = await upgradeService.updateUpgradeProgress(
				userId,
				nodeId,
				progress
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getUpgradeProgress(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { nodeId } = req.params;

			if (!nodeId) {
				return next(ApiError.BadRequest('Node ID is required'));
			}

			const progress = await upgradeService.getUpgradeProgress(
				userId,
				nodeId
			);
			return res.json(progress);
		} catch (err) {
			next(err);
		}
	}

	async initializeUserUpgradeTree(req, res, next) {
		try {
			const userId = req.initdata.id;
			const result = await upgradeService.initializeUserUpgradeTree(
				userId
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getUserUpgradeStats(req, res, next) {
		try {
			const userId = req.initdata.id;
			const stats = await upgradeService.getUserUpgradeStats(userId);
			return res.json(stats);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new UpgradeController();
