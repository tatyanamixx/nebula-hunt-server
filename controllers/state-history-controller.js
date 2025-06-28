const stateHistoryService = require('../service/state-history-service');
const ApiError = require('../exceptions/api-error');

class StateHistoryController {
	/**
	 * Получает историю состояния пользователя
	 */
	async getHistory(req, res, next) {
		try {
			const userId = req.initdata.id;
			const {
				type,
				category,
				startDate,
				endDate,
				search,
				limit = 50,
				offset = 0,
			} = req.query;

			const filters = {
				type,
				category,
				startDate,
				endDate,
				search,
			};

			const history = await stateHistoryService.getHistory(
				userId,
				filters,
				parseInt(limit),
				parseInt(offset)
			);

			return res.json(history);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Получает статистику по истории
	 */
	async getHistoryStats(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { period = 'all' } = req.query;

			const stats = await stateHistoryService.getHistoryStats(
				userId,
				period
			);

			return res.json(stats);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Очищает старые записи истории
	 */
	async cleanupHistory(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { daysToKeep = 90 } = req.body;

			const result = await stateHistoryService.cleanupHistory(
				userId,
				daysToKeep
			);

			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Получает последние записи истории
	 */
	async getRecentHistory(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { limit = 10 } = req.query;

			const history = await stateHistoryService.getHistory(
				userId,
				{},
				parseInt(limit),
				0
			);

			return res.json(history);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new StateHistoryController();
