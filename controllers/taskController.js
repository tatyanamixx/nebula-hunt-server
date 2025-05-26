const ApiError = require('../exceptions/api-error');
const telegram = require('@telegram-apps/init-data-node');

const userTaskService = require('../service/task-service');

class TasksController {
	async createtasks(req, res, next) {
		try {
			const { tasks } = req.body;
			// Validate task network structure
			if (!Array.isArray(tasks)) {
				throw ApiError.BadRequest('Tasks must be an array');
			}

			// Validate each task's structure
			tasks.forEach((task) => {
				if (!task.keyWord || !task.description) {
					throw ApiError.BadRequest(
						'Each task must have keyWord and description'
					);
				}

				if (task.connections) {
					if (!Array.isArray(task.connections)) {
						throw ApiError.BadRequest(
							'Task connections must be an array'
						);
					}
					task.connections.forEach((conn) => {
						if (!conn.toTaskKey) {
							throw ApiError.BadRequest(
								'Each connection must specify toTaskKey'
							);
						}
					});
				}

				if (task.conditions && typeof task.conditions !== 'object') {
					throw ApiError.BadRequest(
						'Task conditions must be an object'
					);
				}
			});

			const userData = await userTaskService.createTasks(tasks);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async activateusertasks(req, res, next) {
		try {
			const userId = req.userToken.id;
			const userData = await userTaskService.activateUserTasks(userId);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async getusertasks(req, res, next) {
		try {
			const userId = req.userToken.id;
			const userData = await userTaskService.getUserTasks(userId);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async completedusertask(req, res, next) {
		try {
			const userId = req.userToken.id;
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
