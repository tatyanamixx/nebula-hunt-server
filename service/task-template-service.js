/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const { TaskTemplate } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const sequelize = require('../db');
const logger = require('./logger-service');

class TaskTemplateService {
	/**
	 * Create multiple task templates
	 * @param {Array} tasks - Array of task template objects
	 * @returns {Promise<Array>} - Created task templates
	 */
	async createTaskTemplates(tasks) {
		const t = await sequelize.transaction();

		try {
			// Set transaction to defer constraints
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});

			const results = [];

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
					logger.debug('Invalid task template data structure', {
						task,
					});
					throw ApiError.BadRequest(
						'Invalid task template data structure',
						ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
					);
				}

				// Prepare task data (exclude id, createdAt, updatedAt)
				const taskData = {
					slug: task.slug,
					title: task.title,
					description: task.description,
					reward: task.reward,
					condition: task.condition,
					icon: task.icon,
					active: task.active ?? true,
					sortOrder: task.sortOrder || 0,
				};

				// Use findOrCreate to handle duplicates
				const [taskTemplate, created] = await TaskTemplate.findOrCreate(
					{
						where: { slug: task.slug },
						defaults: taskData,
						transaction: t,
					}
				);

				// If template already exists, update it
				if (!created) {
					await taskTemplate.update(taskData, { transaction: t });
				}

				results.push(taskTemplate);
			}

			// Set constraints back to immediate before commit
			await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', {
				transaction: t,
			});

			await t.commit();

			// Convert Sequelize instances to plain objects and fix data types
			const plainResults = results.map((task) => {
				const taskData = task.get({ plain: true });
				return {
					...taskData,
					id: parseInt(taskData.id) || taskData.id,
					sortOrder: parseInt(taskData.sortOrder) || 0,
					createdAt: taskData.createdAt
						? new Date(taskData.createdAt).toISOString()
						: null,
					updatedAt: taskData.updatedAt
						? new Date(taskData.updatedAt).toISOString()
						: null,
				};
			});

			return plainResults;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to create task templates', {
				tasks: tasks.length,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to create task templates: ${err.message}`,
				ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get all task templates
	 * @param {Object} filter - Optional filter parameters
	 * @returns {Promise<Array>} - List of task templates
	 */
	async getTaskTemplates() {
		const t = await sequelize.transaction();

		try {
			logger.debug('getTaskTemplates on start');
			const tasks = await TaskTemplate.findAll({
				order: [['sortOrder', 'ASC']],
				transaction: t,
			});

			logger.debug('getTaskTemplates found tasks', {
				count: tasks.length,
			});

			await t.commit();

			// Convert Sequelize instances to plain objects and fix data types
			const plainTasks = tasks.map((task) => {
				const taskData = task.get({ plain: true });
				return {
					...taskData,
					id: parseInt(taskData.id) || taskData.id,
					sortOrder: parseInt(taskData.sortOrder) || 0,
					createdAt: taskData.createdAt
						? new Date(taskData.createdAt).toISOString()
						: null,
					updatedAt: taskData.updatedAt
						? new Date(taskData.updatedAt).toISOString()
						: null,
				};
			});

			logger.debug('getTaskTemplates completed successfully', {
				count: plainTasks.length,
			});

			return plainTasks;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get task templates', {
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get task templates: ${err.message}`,
				ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get task template by ID
	 * @param {string} slug - Task template ID
	 * @returns {Promise<Object>} - Task template
	 */
	async getTaskTemplateBySlug(slug) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getTaskTemplateBySlug on start', { slug });

			const task = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!task) {
				await t.rollback();
				logger.debug('Task template not found', { slug });
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			await t.commit();

			// Convert Sequelize instance to plain object and fix data types
			const taskData = task.get({ plain: true });
			return {
				...taskData,
				id: parseInt(taskData.id) || taskData.id,
				sortOrder: parseInt(taskData.sortOrder) || 0,
				createdAt: taskData.createdAt
					? new Date(taskData.createdAt).toISOString()
					: null,
				updatedAt: taskData.updatedAt
					? new Date(taskData.updatedAt).toISOString()
					: null,
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get task template by slug', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get task template: ${err.message}`,
				ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Update task template
	 * @param {string} slug - Task template ID
	 * @param {Object} taskData - Task template data to update
	 * @returns {Promise<Object>} - Updated task template
	 */
	async updateTaskTemplate(updateData) {
		const t = await sequelize.transaction();

		try {
			logger.debug('updateTaskTemplate on start', {
				slug: updateData.slug,
			});

			// Set transaction to defer constraints
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});

			const task = await TaskTemplate.findOne({
				where: { slug: updateData.slug },
				transaction: t,
			});

			if (!task) {
				await t.rollback();
				logger.debug('Task template not found for update', {
					slug: updateData.slug,
				});
				throw ApiError.NotFound(
					`Task template not found: ${updateData.slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			await task.update(updateData, { transaction: t });

			// Set constraints back to immediate before commit
			await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', {
				transaction: t,
			});

			await t.commit();

			// Convert Sequelize instance to plain object and fix data types
			const taskData = task.get({ plain: true });
			return {
				...taskData,
				id: parseInt(taskData.id) || taskData.id,
				sortOrder: parseInt(taskData.sortOrder) || 0,
				createdAt: taskData.createdAt
					? new Date(taskData.createdAt).toISOString()
					: null,
				updatedAt: taskData.updatedAt
					? new Date(taskData.updatedAt).toISOString()
					: null,
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to update task template', {
				slug: updateData.slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to update task template: ${err.message}`,
				ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
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
			logger.debug('deleteTaskTemplate on start', { slug });

			// Set transaction to defer constraints
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});

			const task = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!task) {
				await t.rollback();
				logger.debug('Task template not found for deletion', { slug });
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			await task.destroy({ transaction: t });

			// Set constraints back to immediate before commit
			await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', {
				transaction: t,
			});

			await t.commit();
			return {
				success: true,
				message: `Task template ${slug} deleted successfully`,
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to delete task template', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to delete task template: ${err.message}`,
				ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
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
			logger.debug('toggleTaskTemplateStatus on start', { slug });

			// Set transaction to defer constraints
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});

			const task = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!task) {
				await t.rollback();
				logger.debug('Task template not found for status toggle', {
					slug,
				});
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			task.active = !task.active;
			await task.save({ transaction: t });

			// Set constraints back to immediate before commit
			await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', {
				transaction: t,
			});

			await t.commit();

			// Convert Sequelize instance to plain object and fix data types
			const taskData = task.get({ plain: true });
			return {
				...taskData,
				id: parseInt(taskData.id) || taskData.id,
				sortOrder: parseInt(taskData.sortOrder) || 0,
				createdAt: taskData.createdAt
					? new Date(taskData.createdAt).toISOString()
					: null,
				updatedAt: taskData.updatedAt
					? new Date(taskData.updatedAt).toISOString()
					: null,
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to toggle task template status', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to update task template status: ${err.message}`,
				ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
			);
		}
	}
}

module.exports = new TaskTemplateService();
