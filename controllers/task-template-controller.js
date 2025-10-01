/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 * updated by Claude on 15.07.2025
 */
const taskTemplateService = require("../service/task-template-service");
const TaskTemplateDTO = require("../dtos/task-template-dto");
const ApiError = require("../exceptions/api-error");

class TaskTemplateController {
	/**
	 * Get all task templates
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getTaskTemplates(req, res, next) {
		try {
			const tasks = await taskTemplateService.getTaskTemplates();

			// Преобразуем в формат для веб-форм
			const formattedTasks = TaskTemplateDTO.toFormFormatArray(tasks);

			console.log(
				"TaskTemplateController.getTaskTemplates - Sending response:",
				formattedTasks.length,
				"tasks"
			);
			return res.json(formattedTasks);
		} catch (err) {
			console.error("TaskTemplateController.getTaskTemplates - Error:", err);
			next(err);
		}
	}

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
					ApiError.BadRequest("Invalid request: task data required")
				);
			}

			// Валидируем JSONB поля
			const validationErrors = TaskTemplateDTO.validateJsonbFields(taskData);
			if (Object.keys(validationErrors).length > 0) {
				return res.status(400).json({
					success: false,
					message: "Validation errors",
					errors: validationErrors,
				});
			}

			// Преобразуем данные из веб-формы в формат для базы данных
			const formattedTaskData = TaskTemplateDTO.fromFormFormat(taskData);

			// Сервис ожидает массив, поэтому оборачиваем в массив
			const result = await taskTemplateService.createTaskTemplates([
				formattedTaskData,
			]);

			// Преобразуем результат обратно в формат для веб-форм
			const formattedResult = TaskTemplateDTO.toFormFormatArray(result);

			return res.json(formattedResult);
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

			// Преобразуем в формат для веб-форм
			const formattedTask = TaskTemplateDTO.toFormFormat(task);

			return res.json(formattedTask);
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

			// Валидируем JSONB поля
			const validationErrors = TaskTemplateDTO.validateJsonbFields(taskData);
			if (Object.keys(validationErrors).length > 0) {
				return res.status(400).json({
					success: false,
					message: "Validation errors",
					errors: validationErrors,
				});
			}

			// Преобразуем данные из веб-формы в формат для базы данных
			const formattedTaskData = TaskTemplateDTO.fromFormFormat(taskData);

			const result = await taskTemplateService.updateTaskTemplate(
				formattedTaskData
			);

			// Преобразуем результат обратно в формат для веб-форм
			const formattedResult = TaskTemplateDTO.toFormFormat(result);

			return res.json(formattedResult);
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

			const result = await taskTemplateService.toggleTaskTemplateStatus(slug);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new TaskTemplateController();
