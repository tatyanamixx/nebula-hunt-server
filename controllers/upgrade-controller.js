const stateService = require('../service/state-service');
const upgradeService = require('../service/upgrade-service');
const ApiError = require('../exceptions/api-error');

class UpgradeController {
	async getUserUpgradeTree(req, res, next) {
		try {
			const userId = req.user.id;
			const tree = await stateService.getUserUpgradeTree(userId);
			return res.json(tree);
		} catch (e) {
			next(e);
		}
	}

	async getUpgradeNodeProgress(req, res, next) {
		try {
			const userId = req.user.id;
			const { nodeName } = req.params;

			if (!nodeName) {
				throw ApiError.BadRequest('Node name is required');
			}

			const progress = await stateService.getUpgradeProgress(
				userId,
				nodeName
			);
			return res.json(progress);
		} catch (e) {
			next(e);
		}
	}

	async updateNodeProgress(req, res, next) {
		try {
			const userId = req.user.id;
			const { nodeName } = req.params;
			const { progressIncrement } = req.body;

			if (!nodeName) {
				throw ApiError.BadRequest('Node name is required');
			}

			if (typeof progressIncrement !== 'number') {
				throw ApiError.BadRequest(
					'Progress increment must be a number'
				);
			}

			const result = await stateService.updateUserUpgradeNode(
				userId,
				nodeName,
				progressIncrement
			);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getUserUpgradeStats(req, res, next) {
		try {
			const userId = req.user.id;
			const stats = await stateService.getUserUpgradeProgress(userId);
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
			const { nodeName } = req.params;
			const nodeData = req.body;

			if (!nodeName) {
				throw ApiError.BadRequest('Node name is required');
			}

			const node = await upgradeService.updateNode(nodeName, nodeData);
			return res.json(node);
		} catch (e) {
			next(e);
		}
	}

	async deleteUpgradeNode(req, res, next) {
		try {
			const { nodeName } = req.params;

			if (!nodeName) {
				throw ApiError.BadRequest('Node name is required');
			}

			await upgradeService.deleteNode(nodeName);
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
