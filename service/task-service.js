/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const { TaskTemplate, UserState, UserTask } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const { SYSTEM_USER_ID } = require('../config/constants');
const sequelize = require('../db');
const marketService = require('./market-service');
const logger = require('./logger-service');

class TaskService {
	/**
	 * Get user task with initialization and deactivation logic
	 * @param {number} userId - User ID
	 * @param {string} slug - Task slug
	 * @returns {Promise<Object>} - User task with initialization/deactivation performed
	 */
	async getUserTask(userId, slug) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getUserTask on start', { userId, slug });

			// First, perform initialization and deactivation logic
			// Get all task templates (both active and inactive) to check existing user tasks
			const allTaskTemplates = await TaskTemplate.findAll({
				transaction: t,
			});

			// Get all existing user tasks
			const existingUserTasks = await UserTask.findAll({
				where: { userId },
				transaction: t,
			});

			// Create a map of template ID to template for quick lookup
			const templateMap = new Map();
			allTaskTemplates.forEach((template) => {
				templateMap.set(template.id, template);
			});

			// Get active task templates for new task creation
			const activeTaskTemplates = allTaskTemplates.filter(
				(template) => template.active
			);

			// Initialize tasks using findOrCreate for active templates
			for (const taskTemplate of activeTaskTemplates) {
				try {
					const [userTask, created] = await UserTask.findOrCreate({
						where: {
							userId,
							taskTemplateId: taskTemplate.id,
						},
						defaults: {
							userId,
							taskTemplateId: taskTemplate.id,
							completed: false,
							reward: taskTemplate.reward || {
								type: 'stardust',
								amount: 0,
							},
							active: true,
						},
						transaction: t,
					});

					if (created) {
						logger.debug('Created new user task', {
							userId,
							taskTemplateId: taskTemplate.id,
							taskSlug: taskTemplate.slug,
						});
					} else {
						logger.debug('User task already exists', {
							userId,
							taskTemplateId: taskTemplate.id,
							taskSlug: taskTemplate.slug,
						});
					}
				} catch (taskError) {
					logger.error('Error creating user task', {
						userId,
						taskTemplateId: taskTemplate.id,
						error: taskError.message,
					});
					throw ApiError.Internal(
						`Failed to create user task for template ${taskTemplate.slug}: ${taskError.message}`,
						ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
					);
				}
			}

			// Check existing user tasks and handle activation/deactivation based on template status
			for (const existingTask of existingUserTasks) {
				const template = templateMap.get(existingTask.taskTemplateId);
				if (template && template.active) {
					// Template is active - reactivate user task if it was inactive
					if (!existingTask.active) {
						try {
							await existingTask.update(
								{ active: true },
								{ transaction: t }
							);
							logger.debug(
								'Reactivated user task due to active template',
								{
									userId,
									taskTemplateId: existingTask.taskTemplateId,
									templateActive: template.active,
								}
							);
						} catch (reactivationError) {
							logger.error('Error reactivating user task', {
								userId,
								taskTemplateId: existingTask.taskTemplateId,
								error: reactivationError.message,
							});
							// Continue processing other tasks even if reactivation fails
						}
					}
				} else {
					// Template is inactive or not found - deactivate the user task
					if (existingTask.active) {
						try {
							await existingTask.update(
								{ active: false },
								{ transaction: t }
							);
							logger.debug(
								'Deactivated user task due to inactive template',
								{
									userId,
									taskTemplateId: existingTask.taskTemplateId,
									templateActive: template
										? template.active
										: 'template_not_found',
								}
							);
						} catch (deactivationError) {
							logger.error('Error deactivating user task', {
								userId,
								taskTemplateId: existingTask.taskTemplateId,
								error: deactivationError.message,
							});
							// Continue processing other tasks even if deactivation fails
						}
					}
				}
			}

			// Update UserState counters
			try {
				const userState = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				if (userState) {
					const [activeTaskCount, completedTaskCount] =
						await Promise.all([
							UserTask.count({
								where: { userId, active: true },
								transaction: t,
							}),
							UserTask.count({
								where: { userId, completed: true },
								transaction: t,
							}),
						]);

					// Update state if it exists
					if (userState.state) {
						userState.state.ownedTasksCount = completedTaskCount;
						userState.state.activeTasksCount = activeTaskCount;
					} else {
						userState.state = {
							ownedTasksCount: completedTaskCount,
							activeTasksCount: activeTaskCount,
						};
					}

					await userState.save({ transaction: t });
					logger.debug('Updated user state task counters', {
						userId,
						activeTasks: activeTaskCount,
						completedTasks: completedTaskCount,
					});
				}
			} catch (stateError) {
				logger.error('Error updating user state task counters', {
					userId,
					error: stateError.message,
				});
				// Не прерываем выполнение, если не удалось обновить счетчики
			}

			// Находим шаблон задачи
			const taskTemplate = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!taskTemplate) {
				logger.debug('getUserTask - task template not found', {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			// Находим задачу пользователя
			const userTask = await UserTask.findOne({
				where: {
					userId,
					taskTemplateId: taskTemplate.id,
					active: true,
					completed: false,
				},
				include: [
					{
						model: TaskTemplate,
						attributes: [
							'id',
							'slug',
							'title',
							'description',
							'reward',
							'condition',
							'icon',
							'active',
							'sortOrder',
						],
					},
				],
				transaction: t,
			});

			if (!userTask) {
				logger.debug('getUserTask - user task not found', {
					userId,
					slug,
					taskTemplateId: taskTemplate.id,
				});
				throw ApiError.BadRequest(
					`User task not found for template: ${slug}`,
					ERROR_CODES.TASK.TASK_NOT_FOUND
				);
			}

			// Check if the template is active
			if (!userTask.tasktemplate.active) {
				logger.debug('getUserTask - template is inactive', {
					userId,
					slug,
					taskTemplateId: taskTemplate.id,
					templateActive: userTask.tasktemplate.active,
				});
				throw ApiError.BadRequest(
					`Task template is inactive: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_INACTIVE
				);
			}

			const result = {
				id: userTask.id,
				slug: userTask.tasktemplate.slug,
				userId: userTask.userId,
				taskId: userTask.taskId,
				completed: userTask.completed,
				active: userTask.active,
				task: userTask.tasktemplate,
				sortOrder: userTask.tasktemplate.sortOrder,
				reward: userTask.tasktemplate.reward,
				condition: userTask.tasktemplate.condition,
				icon: userTask.tasktemplate.icon,
				active: userTask.tasktemplate.active,
			};

			await t.commit();

			logger.debug('getUserTask completed successfully', {
				userId,
				slug,
				taskId: userTask.id,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user task', {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user task: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getUserTasks(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getUserTasks on start', { userId });

			// Получаем все задачи пользователя с информацией о задачах
			const userTasks = await UserTask.findAll({
				where: { userId },
				include: [
					{
						model: TaskTemplate,
						attributes: [
							'id',
							'slug',
							'title',
							'description',
							'reward',
							'condition',
							'icon',
							'active',
							'sortOrder',
						],
					},
				],
				transaction: t,
			});

			const result = userTasks.map((userTask) => ({
				id: userTask.id,
				slug: userTask.tasktemplate.slug,
				userId: userTask.userId,
				taskId: userTask.taskId,
				completed: userTask.completed,
				reward: userTask.reward,
				active: userTask.active,
				completedAt: userTask.completedAt,
				task: userTask.tasktemplate,
				sortOrder: userTask.tasktemplate.sortOrder,
				reward: userTask.tasktemplate.reward,
				condition: userTask.tasktemplate.condition,
				icon: userTask.tasktemplate.icon,
				active: userTask.tasktemplate.active,
				sortOrder: userTask.tasktemplate.sortOrder,
			}));

			await t.commit();

			logger.debug('getUserTasks completed successfully', {
				userId,
				tasksCount: result.length,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user tasks', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user tasks: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}
	/**
	 * Complete a task for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Task slug
	 * @param {Transaction} transaction - Optional transaction object
	 * @returns {Promise<Object>} - Completed task
	 */
	async completeTask(userId, slug, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			logger.debug('completeTask on start', { userId, slug });

			// Находим шаблон задачи
			const taskTemplate = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!taskTemplate) {
				logger.debug('completeTask - task template not found', {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			// Находим задачу пользователя
			const userTask = await UserTask.findOne({
				where: {
					userId,
					taskTemplateId: taskTemplate.id,
					active: true,
					completed: false,
				},
				include: [
					{
						model: TaskTemplate,
						attributes: ['reward'],
					},
				],
				transaction: t,
			});

			if (!userTask) {
				logger.debug('completeTask - user task not found', {
					userId,
					slug,
					taskTemplateId: taskTemplate.id,
				});
				throw ApiError.BadRequest(
					`User task not found for template: ${slug}`,
					ERROR_CODES.TASK.TASK_NOT_FOUND
				);
			}

			// Если задача уже завершена, возвращаем информацию
			if (userTask.completed) {
				logger.debug('completeTask - task already completed', {
					userId,
					slug,
				});
				return { success: false, userTask };
			}

			// Помечаем задачу как завершенную
			const now = new Date();
			userTask.completed = true;
			userTask.completedAt = now;
			userTask.reward = taskTemplate.reward;
			await userTask.save({ transaction: t });

			// Создаем offer для регистрации изменений в состоянии через registerOffer
			const reward = taskTemplate.reward;
			const offerData = {
				sellerId: SYSTEM_USER_ID, // Системный аккаунт
				buyerId: userId,
				price: 0, // Задачи не имеют цены
				currency: reward.type, // Используем тип награды как валюту
				resource: reward.type, // Используем тип награды как ресурс
				amount: reward.amount,
				itemType: 'task',
				itemId: userTask.id, // userTaskId
				offerType: 'SYSTEM',
				txType: 'TASK_REWARD',
			};

			// Используем registerOffer для регистрации изменений в состоянии
			const result = await marketService.registerOffer(offerData, t);

			// Получаем обновленное состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.debug('completeTask completed successfully', {
				userId,
				slug,
				taskId: userTask.id,
				reward: reward,
				marketResult: result,
			});

			return {
				success: true,
				userTask,
				userState: userState,
				marketResult: result,
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error('Failed to complete task', {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to complete task: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getActiveTasks(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getActiveTasks on start', { userId });

			const activeTasks = await UserTask.findAll({
				where: {
					userId,
					active: true,
					completed: false,
				},
				include: [
					{
						model: TaskTemplate,
						attributes: [
							'id',
							'slug',
							'title',
							'description',
							'reward',
							'condition',
							'icon',
							'active',
							'sortOrder',
						],
					},
				],
				transaction: t,
			});

			// Filter out tasks whose templates are inactive
			const filteredTasks = activeTasks.filter((userTask) => {
				const templateActive =
					userTask.tasktemplate && userTask.tasktemplate.active;
				if (!templateActive) {
					logger.debug('Filtering out task with inactive template', {
						userId,
						taskTemplateId: userTask.taskTemplateId,
						templateActive: templateActive,
					});
				}
				return templateActive;
			});

			const result = filteredTasks.map((userTask) => ({
				id: userTask.id,
				slug: userTask.tasktemplate.slug,
				userId: userTask.userId,
				taskId: userTask.taskId,
				completed: userTask.completed,
				reward: userTask.reward,
				active: userTask.active,
				completedAt: userTask.completedAt,
				task: userTask.tasktemplate,
				sortOrder: userTask.tasktemplate.sortOrder,
				reward: userTask.tasktemplate.reward,
				condition: userTask.tasktemplate.condition,
				icon: userTask.tasktemplate.icon,
				active: userTask.tasktemplate.active,
				sortOrder: userTask.tasktemplate.sortOrder,
			}));

			await t.commit();

			logger.debug('getActiveTasks completed successfully', {
				userId,
				activeTasksCount: result.length,
				filteredOutCount: activeTasks.length - filteredTasks.length,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get active tasks', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get active tasks: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getCompletedTasks(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getCompletedTasks on start', { userId });

			const completedTasks = await UserTask.findAll({
				where: {
					userId,
					completed: true,
				},
				include: [
					{
						model: TaskTemplate,
						attributes: [
							'id',
							'slug',
							'title',
							'description',
							'reward',
							'condition',
							'icon',
							'active',
							'sortOrder',
						],
					},
				],
				transaction: t,
			});

			const result = completedTasks.map((userTask) => ({
				id: userTask.id,
				slug: userTask.tasktemplate.slug,
				userId: userTask.userId,
				taskId: userTask.taskId,
				completed: userTask.completed,
				reward: userTask.reward,
				active: userTask.active,
				completedAt: userTask.completedAt,
				task: userTask.tasktemplate,
				sortOrder: userTask.tasktemplate.sortOrder,
				reward: userTask.tasktemplate.reward,
				condition: userTask.tasktemplate.condition,
				icon: userTask.tasktemplate.icon,
				active: userTask.tasktemplate.active,
				sortOrder: userTask.tasktemplate.sortOrder,
			}));

			await t.commit();

			logger.debug('getCompletedTasks completed successfully', {
				userId,
				completedTasksCount: result.length,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get completed tasks', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get completed tasks: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getTotalTaskReward(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getTotalTaskReward on start', { userId });

			// Получаем все завершенные задачи пользователя
			const completedTasks = await UserTask.findAll({
				where: {
					userId,
					completed: true,
				},
				transaction: t,
			});

			// Вычисляем общую награду
			let totalReward = 0;
			for (const task of completedTasks) {
				const reward = task.reward || { amount: 0 };
				totalReward += reward.amount || 0;
			}

			await t.commit();

			logger.debug('getTotalTaskReward completed successfully', {
				userId,
				totalReward,
				completedTasksCount: completedTasks.length,
			});

			return { totalReward };
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get total task reward', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get total task reward: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getTaskStatus(userId, slug) {
		try {
			logger.debug('getTaskStatus on start', { userId, slug });

			// Находим шаблон задачи
			const taskTemplate = await TaskTemplate.findOne({
				where: { slug },
			});

			if (!taskTemplate) {
				logger.debug('getTaskStatus - task template not found', {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			// Находим задачу пользователя
			const userTask = await UserTask.findOne({
				where: {
					userId,
					taskTemplateId: taskTemplate.id,
					active: true,
				},
			});

			if (!userTask) {
				logger.debug('getTaskStatus - user task not found', {
					userId,
					slug,
					taskTemplateId: taskTemplate.id,
				});
				throw ApiError.BadRequest(
					`User task not found for template: ${slug}`,
					ERROR_CODES.TASK.TASK_NOT_FOUND
				);
			}

			const result = {
				taskId: taskTemplate.id,
				slug: taskTemplate.slug,
				completed: userTask.completed,
				active: userTask.active,
				completedAt: userTask.completedAt,
				sortOrder: userTask.tasktemplate.sortOrder,
				reward: userTask.tasktemplate.reward,
				condition: userTask.tasktemplate.condition,
				icon: userTask.tasktemplate.icon,
				active: userTask.tasktemplate.active,
				sortOrder: userTask.tasktemplate.sortOrder,
			};

			logger.debug('getTaskStatus completed successfully', {
				userId,
				slug,
				completed: userTask.completed,
				active: userTask.active,
			});

			return result;
		} catch (err) {
			logger.error('Failed to get task status', {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get task status: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getUserTaskStats(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getUserTaskStats on start', { userId });

			// Get all user tasks
			const userTasks = await UserTask.findAll({
				where: { userId },
				transaction: t,
			});

			// Calculate statistics
			const totalTasks = userTasks.length;
			const completedTasks = userTasks.filter(
				(task) => task.completed
			).length;
			const activeTasks = userTasks.filter(
				(task) => task.active && !task.completed
			).length;

			// Calculate completion percentage
			const completionPercentage =
				totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

			await t.commit();

			const result = {
				total: totalTasks,
				completed: completedTasks,
				active: activeTasks,
				completionPercentage,
				lastUpdate: new Date(),
			};

			logger.debug('getUserTaskStats completed successfully', {
				userId,
				totalTasks,
				completedTasks,
				activeTasks,
				completionPercentage,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user task stats', {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user task stats: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getTaskStats(userId) {
		// Alias for getUserTaskStats
		logger.debug('getTaskStats called (alias for getUserTaskStats)', {
			userId,
		});
		return await this.getUserTaskStats(userId);
	}
}

module.exports = new TaskService();
