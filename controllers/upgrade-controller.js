const stateService = require('../service/state-service');
const upgradeService = require('../service/upgrade-service');
const ApiError = require('../exceptions/api-error');

class UpgradeController {
	async getUserUpgradeTree(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const tree = await stateService.getUserUpgradeTree(id);
			return res.json(tree);
		} catch (e) {
			next(e);
		}
	}

	async getUpgradeNodeProgress(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const { nodeId } = req.params;

			if (!nodeId) {
				throw ApiError.BadRequest('Node ID is required');
			}

			const progress = await stateService.getUpgradeProgress(id, nodeId);
			return res.json(progress);
		} catch (e) {
			next(e);
		}
	}

	async updateNodeProgress(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const { nodeId } = req.params;
			const { progressIncrement } = req.body;

			if (!nodeId) {
				throw ApiError.BadRequest('Node ID is required');
			}

			if (typeof progressIncrement !== 'number') {
				throw ApiError.BadRequest(
					'Progress increment must be a number'
				);
			}

			const result = await stateService.updateUserUpgradeNode(
				id,
				nodeId,
				progressIncrement
			);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getUserUpgradeStats(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const stats = await stateService.getUserUpgradeProgress(id);
			return res.json(stats);
		} catch (e) {
			next(e);
		}
	}

	// Административные методы
	async createUpgradeNodes(req, res, next) {
		try {
			const { nodes } = req.body;

			if (!Array.isArray(nodes)) {
				throw ApiError.BadRequest('Nodes must be an array');
			}

			const createdNodes = await upgradeService.createUpgradeNodes(nodes);
			return res.json(createdNodes);
		} catch (e) {
			next(e);
		}
	}

	async updateUpgradeNode(req, res, next) {
		try {
			const { nodeId } = req.params;
			const nodeData = req.body;

			if (!nodeId) {
				throw ApiError.BadRequest('Node ID is required');
			}

			const node = await upgradeService.updateNode(nodeId, nodeData);
			return res.json(node);
		} catch (e) {
			next(e);
		}
	}

	async deleteUpgradeNode(req, res, next) {
		try {
			const { nodeId } = req.params;

			if (!nodeId) {
				throw ApiError.BadRequest('Node ID is required');
			}

			await upgradeService.deleteNode(nodeId);
			return res.json({ message: 'Node deleted successfully' });
		} catch (e) {
			next(e);
		}
	}

	async getAllUpgradeNodes(req, res, next) {
		try {
			const nodes = await upgradeService.getAllNodes();
			return res.json(nodes);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UpgradeController();
