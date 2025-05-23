const ApiError = require('../exceptions/api-error');
const telegram = require('@telegram-apps/init-data-node');

const userTaskService = require('../service/task-service');

class TasksController {
	async createtasks(req, res, next) {
		try {
			const { tasks } = req.body;
			const userData = await userTaskService.createTasks(tasks);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}
	
	async activateusertasks(req, res, next) {
		try {
			//const userId = req.userToken.id;
			const { userId } = req.userToken.id;
			const userData = await userTaskService.activateUserTasks(userId);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async getusertasks(req, res, next) {
		try {
			//const userId = req.userToken.id;
			const { userId } = req.userToken.id;
			const userData = await userTaskService.getUserTasks(userId);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async completedusertask(req, res, next) {
		try {
			//const userId = req.userToken.id;
			const { userId } = req.userToken.id;
			const { taskId } = req.params;
			const userData = await userTaskService.completedUserTask(
				userId,
				taskId
			);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new TasksController();
