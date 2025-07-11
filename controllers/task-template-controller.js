/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 * updated by Claude on 15.07.2025
 */
const taskTemplateService = require('../service/task-template-service');
const ApiError = require('../exceptions/api-error');

class TaskTemplateController {
	/**
	 * Create a new task template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async createTaskTemplate(req, res, next) {
		try {
			const taskData = req.body;
			if (!taskData) {
				return next(
					ApiError.BadRequest('Invalid request: task data required')
				);
			}

			const result = await taskTemplateService.createTaskTemplate(
				taskData
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Get all task templates
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getAllTaskTemplates(req, res, next) {
		try {
			const { active } = req.query;
			const filter = {};

			if (active !== undefined) {
				filter.active = active === 'true';
			}

			const tasks = await taskTemplateService.getAllTaskTemplates(filter);
			return res.json(tasks);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Get task template by ID
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getTaskTemplate(req, res, next) {
		try {
			const { taskId } = req.params;
			const task = await taskTemplateService.getTaskTemplateById(taskId);
			return res.json(task);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Update task template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async updateTaskTemplate(req, res, next) {
		try {
			const { taskId } = req.params;
			const taskData = req.body;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const result = await taskTemplateService.updateTaskTemplate(
				taskId,
				taskData
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Delete task template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async deleteTaskTemplate(req, res, next) {
		try {
			const { taskId } = req.params;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const result = await taskTemplateService.deleteTaskTemplate(taskId);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Activate task template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async activateTaskTemplate(req, res, next) {
		try {
			const { taskId } = req.params;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const result = await taskTemplateService.setTaskTemplateStatus(
				taskId,
				true
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Deactivate task template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async deactivateTaskTemplate(req, res, next) {
		try {
			const { taskId } = req.params;

			if (!taskId) {
				return next(ApiError.BadRequest('Task ID is required'));
			}

			const result = await taskTemplateService.setTaskTemplateStatus(
				taskId,
				false
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new TaskTemplateController();
