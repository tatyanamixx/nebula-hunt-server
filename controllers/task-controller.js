/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const taskService = require('../service/task-service');
const ApiError = require('../exceptions/api-error');

class TaskController {
	async createTasks(req, res, next) {
		try {
			const { tasks } = req.body;
			if (!tasks || !Array.isArray(tasks)) {
				return next(
					ApiError.BadRequest('Invalid request: tasks array required')
				);
			}

			const result = await taskService.createTasks(tasks);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getUserTasks(req, res, next) {
		try {
			const userId = req.initdata.id;
			const tasks = await taskService.getUserTasks(userId);
			return res.json({ tasks });
		} catch (err) {
			next(err);
		}
	}

	async getUserTask(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { taskId } = req.params;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const task = await taskService.getUserTask(userId, taskId);
			return res.json(task);
		} catch (err) {
			next(err);
		}
	}

	async getAllTasks(req, res, next) {
		try {
			const tasks = await taskService.getAllTasks();
			return res.json(tasks);
		} catch (err) {
			next(err);
		}
	}

	async completeTask(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { taskId } = req.body;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const result = await taskService.completeTask(userId, taskId);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async updateTaskProgress(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { taskId, progress } = req.body;

			if (!taskId || progress === undefined) {
				return next(
					ApiError.BadRequest('Task ID and progress are required')
				);
			}

			const result = await taskService.updateTaskProgress(
				userId,
				taskId,
				progress
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getTaskProgress(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { taskId } = req.params;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const progress = await taskService.getTaskProgress(userId, taskId);
			return res.json(progress);
		} catch (err) {
			next(err);
		}
	}

	async initializeUserTasks(req, res, next) {
		try {
			const userId = req.initdata.id;
			const result = await taskService.initializeUserTasks(userId);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getUserTaskStats(req, res, next) {
		try {
			const userId = req.initdata.id;
			const stats = await taskService.getUserTaskStats(userId);
			return res.json(stats);
		} catch (err) {
			next(err);
		}
	}

	// Административные методы
	async updateTask(req, res, next) {
		try {
			const { taskId } = req.params;
			const taskData = req.body;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const task = await taskService.updateTask(taskId, taskData);
			return res.json(task);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new TaskController();
