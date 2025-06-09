const taskService = require('../service/task-service');
const ApiError = require('../exceptions/api-error');

class TaskController {
	async getUserTasks(req, res, next) {
		try {
			const userId = req.user.id;
			const tasks = await taskService.getUserTasks(userId);
			return res.json(tasks);
		} catch (e) {
			next(e);
		}
	}

	async updateTaskProgress(req, res, next) {
		try {
			const userId = req.user.id;
			const taskId = req.params.taskId;
			const { progress } = req.body;

			if (progress === undefined) {
				throw ApiError.BadRequest('Progress value is required');
			}

			const updatedTask = await taskService.updateTaskProgress(
				userId,
				taskId,
				progress
			);
			return res.json(updatedTask);
		} catch (e) {
			next(e);
		}
	}

	async createTask(req, res, next) {
		try {
			const tasks = req.body;
			const createdTasks = await taskService.createTasks(tasks);
			return res.json(createdTasks);
		} catch (e) {
			next(e);
		}
	}

	async updateTask(req, res, next) {
		try {
			const taskId = req.params.taskId;
			const taskData = req.body;
			const updatedTask = await taskService.updateTask(taskId, taskData);
			return res.json(updatedTask);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new TaskController();
