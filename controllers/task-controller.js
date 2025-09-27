/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const taskService = require("../service/task-service");
const ApiError = require("../exceptions/api-error");

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

	async completeTask(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { slug } = req.params;

			if (!slug) {
				return next(ApiError.BadRequest("Task slug is required"));
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
