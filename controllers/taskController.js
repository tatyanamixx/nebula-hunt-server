const ApiError = require('../exceptions/api-error');
const telegram = require('@telegram-apps/init-data-node');

const userTaskService = require('../service/task-service');

class TasksController {
	async useractivetasks(req, res, next) {
		try {
			const userId = req.userToken.id;
			const userData = await userTaskService.userActiveTasks(userId);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async useractivetasks(req, res, next) {
		try {
			const userId = req.userToken.id;
			const taskId = req.params;
			const userData = await userTaskService.completedTask(userId, taskId);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new TasksController();
