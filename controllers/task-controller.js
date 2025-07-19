/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const taskService = require('../service/task-service');
const ApiError = require('../exceptions/api-error');

class TaskController {
	async getUserTasks(req, res, next) {
		try {
			const userId = req.initdata.id;
			const tasks = await taskService.getUserTasks(userId);
			return res.json(tasks);
		} catch (err) {
			next(err);
		}
	}

	async getActiveTasks(req, res, next) {
		try {
			const userId = req.initdata.id;
			const tasks = await taskService.getActiveTasks(userId);
			return res.json(tasks);
		} catch (err) {
			next(err);
		}
	}

	async getCompletedTasks(req, res, next) {
		try {
			const userId = req.initdata.id;
			const tasks = await taskService.getCompletedTasks(userId);
			return res.json(tasks);
		} catch (err) {
			next(err);
		}
	}

	async getTaskStats(req, res, next) {
		try {
			const userId = req.initdata.id;
			const stats = await taskService.getTaskStats(userId);
			return res.json(stats);
		} catch (err) {
			next(err);
		}
	}

	async getUserTask(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { slug } = req.params;
			const task = await taskService.getUserTask(userId, slug);
			return res.json(task);
		} catch (err) {
			next(err);
		}
	}

	async updateTaskProgress(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { slug, progress } = req.body;

			if (!slug) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			if (progress === undefined) {
				return next(ApiError.BadRequest('Progress value is required'));
			}

			const result = await taskService.updateTaskProgress(
				userId,
				slug,
				progress
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async completeTask(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { slug } = req.params;

			if (!slug) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const result = await taskService.completeTask(userId, slug);
			return res.json(result);
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
}

module.exports = new TaskController();
