/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const { TaskTemplate, UserState, UserTask } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const marketService = require('./market-service');
const logger = require('./logger-service');

class TaskService {
	/**
	 * Initialize tasks for a new user
	 * @param {number} userId - User ID
	 * @param {Transaction} transaction - Optional transaction object
	 * @returns {Promise<Object>} - Initialized tasks
	 */
	async initializeUserTasks(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		logger.debug('initializeUserTasks on start', {
			userId,
		});
		try {
			// Get all active tasks
			const tasks = await TaskTemplate.findAll({
				where: {
					active: true,
				},
				transaction: t,
			});

			if (tasks.length === 0) {
				if (shouldCommit && !t.finished) {
					await t.commit();
				}
				return {
					tasks: [],
				};
			}

			// Create entries for all active tasks
			const initializedTasks = [];
			for (const task of tasks) {
				let userTask = await UserTask.findOne({
					where: {
						userId,
						slug: task.slug,
					},
					transaction: t,
				});
				if (!userTask) {
					userTask = await UserTask.create(
						{
							userId,
							taskId: task.id,
							completed: false,
							reward: 0,
							active: true,
						},
						{ transaction: t }
					);

					initializedTasks.push({
						...userTask.toJSON(),
						slug: task.slug,
						task: task.toJSON(),
					});
				}
			}

			// Update counter in UserState
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				const activeTaskCount = await UserTask.count({
					where: {
						userId,
						active: true,
					},
					transaction: t,
				});

				const completedTaskCount = await UserTask.count({
					where: {
						userId,
						completed: true,
					},
					transaction: t,
				});

				userState.state.ownedTasksCount = completedTaskCount;
				await userState.save({ transaction: t });
			}

			const totalReward = await UserTask.sum('reward.amount', {
				where: {
					userId,
					completed: true,
				},
			});

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			return {
				tasks: initializedTasks,
				reward: {
					task: totalReward || 0,
				},
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to initialize user tasks: ${err.message}`
			);
		}
	}

	async getUserTasks(userId) {
		const t = await sequelize.transaction();

		try {
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
			}));

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get user tasks: ${err.message}`);
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
			logger.debug('completeTask on start', {
				userId,
				slug,
			});
			const taskTemplate = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!taskTemplate) {
				logger.debug('completeTask on end', {
					userId,
					slug,
					error: 'Task not found',
				});
				throw ApiError.NotFound('Task not found');
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
				logger.debug('completeTask on end', {
					userId,
					slug,
					error: 'User task not found',
				});
				await t.rollback();
				throw ApiError.BadRequest('User task not found');
			}

			// Если задача уже завершена, ничего не делаем
			if (userTask.completed) {
				logger.debug('completeTask on end', {
					userId,
					slug,
					error: 'User task already completed',
				});
				await t.rollback();
				return { success: false, userTask };
			}

			// Помечаем задачу как завершенную
			const now = new Date();
			userTask.completed = true;
			userTask.completedAt = now;
			userTask.reward = userTask.tasktemplate.reward;
			await userTask.save({ transaction: t });

			if (shouldCommit && !t.finished) {
				await t.commit();
			}
			logger.debug('completeTask on end', {
				userId,
				slug,
				userTask,
			});
			return { success: true, userTask };
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			logger.debug('completeTask on end', {
				userId,
				slug,
				error: err.message,
			});
			throw ApiError.Internal(`Failed to complete task: ${err.message}`);
		}
	}

	async getActiveTasks(userId) {
		const t = await sequelize.transaction();

		try {
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
						],
					},
				],
				transaction: t,
			});

			const result = activeTasks.map((userTask) => ({
				id: userTask.id,
				slug: userTask.tasktemplate.slug,
				userId: userTask.userId,
				taskId: userTask.taskId,
				completed: userTask.completed,
				reward: userTask.reward,
				active: userTask.active,
				completedAt: userTask.completedAt,
				task: userTask.tasktemplate,
			}));

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get active tasks: ${err.message}`
			);
		}
	}

	async getCompletedTasks(userId) {
		const t = await sequelize.transaction();

		try {
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
			}));

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get completed tasks: ${err.message}`
			);
		}
	}

	async getTotalTaskReward(userId) {
		const t = await sequelize.transaction();

		try {
			const totalReward =
				(await UserTask.sum('reward', {
					where: {
						userId,
						completed: true,
					},
					transaction: t,
				})) || 0;

			await t.commit();
			return { totalReward };
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get total task reward: ${err.message}`
			);
		}
	}

	async getUserTask(userId, slug) {
		const t = await sequelize.transaction();

		try {
			const task = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!task) {
				throw ApiError.NotFound('Task not found');
			}
			const userTask = await UserTask.findOne({
				where: {
					userId,
					taskId: task.id,
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
						],
					},
				],
				transaction: t,
			});

			if (!userTask) {
				await t.rollback();
				throw ApiError.BadRequest('User task not found');
			}

			const result = {
				id: userTask.id,
				slug: userTask.tasktemplate.slug,
				userId: userTask.userId,
				taskId: userTask.taskId,
				completed: userTask.completed,
				active: userTask.active,
				task: userTask.tasktemplate,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get user task: ${err.message}`);
		}
	}

	async getTaskStatus(userId, slug) {
		try {
			const task = await TaskTemplate.findOne({
				where: { slug },
			});
			if (!task) {
				throw ApiError.NotFound('Task not found');
			}
			const userTask = await UserTask.findOne({
				where: {
					userId,
					taskId: task.id,
					active: true,
				},
			});

			if (!userTask) {
				throw ApiError.BadRequest('User task not found');
			}

			return {
				taskId: task.id,
				slug: task.slug,
				completed: userTask.completed,
				active: userTask.active,
				completedAt: userTask.completedAt,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get task status: ${err.message}`
			);
		}
	}

	async getUserTaskStats(userId) {
		const t = await sequelize.transaction();

		try {
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

			return {
				total: totalTasks,
				completed: completedTasks,
				active: activeTasks,
				completionPercentage,
				lastUpdate: new Date(),
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user task stats: ${err.message}`
			);
		}
	}

	async getTaskStats(userId) {
		// Alias for getUserTaskStats
		return await this.getUserTaskStats(userId);
	}
}

module.exports = new TaskService();
