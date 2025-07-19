/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const { TaskTemplate } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');

class TaskTemplateService {
	/**
	 * Create multiple task templates
	 * @param {Array} tasks - Array of task template objects
	 * @returns {Promise<Array>} - Created task templates
	 */
	async createTaskTemplates(tasks) {
		const t = await sequelize.transaction();

		try {
			// Create tasks in bulk
			const createdTasks = [];

			for (const task of tasks) {
				// Validate task data
				if (
					!task.slug ||
					!task.title ||
					!task.description ||
					!task.reward ||
					!task.condition ||
					!task.icon
				) {
					await t.rollback();
					throw ApiError.BadRequest(
						'Invalid task template data structure'
					);
				}
				const ts = await TaskTemplate.findOne({
					where: { slug: task.slug },
					transaction: t,
				});
				if (ts) {
					await ts.update(task, { transaction: t });
					createdTasks.push(ts);
					continue;
				}
				if (!ts) {
				// Create task with levels included
				const newTask = await TaskTemplate.create(
					{
						slug: task.slug,
						title: task.title,
						description: task.description,
						reward: task.reward,
						condition: task.condition,
						icon: task.icon,
						active: task.active ?? true,
					},
					{ transaction: t }
				);
				if (newTask) {
					createdTasks.push(newTask);
				}
				}
			}

			await t.commit();
			return createdTasks;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to create task templates: ${err.message}`
			);
		}
	}

	/**
	 * Get all task templates
	 * @param {Object} filter - Optional filter parameters
	 * @returns {Promise<Array>} - List of task templates
	 */
	async getTaskTemplates() {
		try {

			const tasks = await TaskTemplate.findAll({
				order: [['sortOrder', 'ASC']],
			});

			return tasks;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get task templates: ${err.message}`
			);
		}
	}

	/**
	 * Get task template by ID
	 * @param {string} slug - Task template ID
	 * @returns {Promise<Object>} - Task template
	 */
	async getTaskTemplateBySlug(slug) {
		try {
			const task = await TaskTemplate.findOne({
				where: { slug },
			});

			if (!task) {
				throw ApiError.BadRequest('Task template not found');
			}

			return task;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get task template: ${err.message}`
			);
		}
	}

	/**
	 * Update task template
	 * @param {string} slug - Task template ID
	 * @param {Object} taskData - Task template data to update
	 * @returns {Promise<Object>} - Updated task template
	 */
	async updateTaskTemplate(taskData) {
		const t = await sequelize.transaction();

		try {
			const task = await TaskTemplate.findOne({
				where: { slug: taskData.slug },
				transaction: t,
			});

			if (!task) {
				await t.rollback();
				throw ApiError.BadRequest('Task template not found');
			}

			await task.update(taskData, { transaction: t });

			await t.commit();
			return task;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update task template: ${err.message}`
			);
		}
	}

	/**
	 * Delete task template
	 * @param {string} slug - Task template ID
	 * @returns {Promise<Object>} - Result of deletion
	 */
	async deleteTaskTemplate(slug) {
		const t = await sequelize.transaction();

		try {
			const task = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!task) {
				await t.rollback();
				throw ApiError.BadRequest('Task template not found');
			}

			await task.destroy({ transaction: t });

			await t.commit();
			return {
				success: true,
				message: `Task template ${slug} deleted successfully`,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to delete task template: ${err.message}`
			);
		}
	}

	/**
	 * Activate or deactivate task template
	 * @param {string} slug - Task template ID
	 * @param {boolean} active - Active status
	 * @returns {Promise<Object>} - Updated task template
	 */
	async toggleTaskTemplateStatus(slug) {
		const t = await sequelize.transaction();

		try {
			const task = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!task) {
				await t.rollback();
				throw ApiError.BadRequest('Task template not found');
			}

			task.active = !task.active;
			await task.save({ transaction: t });

			await t.commit();
			return task;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update task template status: ${err.message}`
			);
		}
	}
}

module.exports = new TaskTemplateService();
