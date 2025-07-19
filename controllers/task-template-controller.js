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
	async createTaskTemplates(req, res, next) {
		try {
			const taskData = req.body;
			if (!taskData) {
				return next(
					ApiError.BadRequest('Invalid request: task data required')
				);
			}

			const result = await taskTemplateService.createTaskTemplates(
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
	async getTaskTemplates(req, res, next) {
		try {
			const tasks = await taskTemplateService.getTaskTemplates();
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
	async getTaskTemplateBySlug(req, res, next) {
		try {
			const { slug } = req.params;
			const task = await taskTemplateService.getTaskTemplateBySlug(slug);
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
			const taskData = req.body;

			const result = await taskTemplateService.updateTaskTemplate(
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
			const { slug } = req.params;

			const result = await taskTemplateService.deleteTaskTemplate(slug);
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
	async toggleTaskTemplateStatus(req, res, next) {
		try {
			const { slug } = req.params;

			const result = await taskTemplateService.toggleTaskTemplateStatus(
				slug
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new TaskTemplateController();
