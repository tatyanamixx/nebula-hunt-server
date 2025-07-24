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
							progress: 0,
							targetProgress:
								task.condition?.targetProgress || 100,
							completed: false,
							reward: 0,
							progressHistory: [],
							lastProgressUpdate: new Date(),
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

			const totalReward = await UserTask.sum('reward', {
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
				progress: userTask.progress,
				targetProgress: userTask.targetProgress,
				completed: userTask.completed,
				reward: userTask.reward,
				progressHistory: userTask.progressHistory,
				lastProgressUpdate: userTask.lastProgressUpdate,
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

	async updateTaskProgress(userId, slug, progress) {
		const t = await sequelize.transaction();

		try {
			const task = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!task) {
				throw ApiError.NotFound('Task not found');
			}
			// Находим задачу пользователя
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
						attributes: ['reward'],
					},
				],
				transaction: t,
			});

			if (!userTask) {
				await t.rollback();
				throw ApiError.BadRequest('User task not found');
			}

			// Если задача уже завершена, ничего не делаем
			if (userTask.completed) {
				await t.rollback();
				return userTask;
			}

			// Обновляем прогресс
			const oldProgress = userTask.progress;
			userTask.progress = Math.min(
				userTask.progress + progress,
				userTask.targetProgress
			);

			// Добавляем запись в историю прогресса
			const now = new Date();
			userTask.progressHistory.push({
				timestamp: now,
				oldValue: oldProgress,
				newValue: userTask.progress,
				increment: progress,
			});

			userTask.lastProgressUpdate = now;
			await userTask.save({ transaction: t });

			// Если прогресс достиг цели, помечаем как завершенную
			if (userTask.progress >= userTask.targetProgress) {
				userTask.completed = true;
				userTask.completedAt = now;
				userTask.reward = userTask.tasktemplate.reward;
				await userTask.save({ transaction: t });

				// Обновляем счетчик в UserState
				const userState = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				if (userState && userState.state) {
					userState.state.ownedTasksCount =
						(userState.state.ownedTasksCount || 0) + 1;
					await userState.save({ transaction: t });
				}
			}

			await t.commit();
			return userTask;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update task progress: ${err.message}`
			);
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
				slug: userTask.tasktemplate.slug,
				progress: userTask.progress,
				targetProgress: userTask.targetProgress,
				completed: userTask.completed,
				reward: userTask.reward,
				progressHistory: userTask.progressHistory,
				lastProgressUpdate: userTask.lastProgressUpdate,
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
				slug: userTask.tasktemplate.slug,
				progress: userTask.progress,
				targetProgress: userTask.targetProgress,
				completed: userTask.completed,
				reward: userTask.reward,
				progressHistory: userTask.progressHistory,
				lastProgressUpdate: userTask.lastProgressUpdate,
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
				slug: userTask.tasktemplate.slug,
				progress: userTask.progress,
				targetProgress: userTask.targetProgress,
				completed: userTask.completed,
				active: userTask.active,
				progressHistory: userTask.progressHistory,
				lastProgressUpdate: userTask.lastProgressUpdate,
				task: userTask.tasktemplate,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get user task: ${err.message}`);
		}
	}

	async completeTask(userId, slug) {
		const t = await sequelize.transaction();

		try {
			// Find the user task
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
				transaction: t,
			});

			if (!userTask) {
				await t.rollback();
				throw ApiError.BadRequest('User task not found');
			}

			// Check if task is already completed
			if (userTask.completed) {
				await t.rollback();
				return {
					userTask,
					slug: userTask.tasktemplate.slug,
					reward: userTask.reward,
					rewardType: userTask.rewardType,
				};
			}

			// Check if task has enough progress
			if (userTask.progress < userTask.targetProgress) {
				await t.rollback();
				throw ApiError.BadRequest(
					'Not enough progress to complete this task'
				);
			}

			// Get the task to determine reward

			// Mark task as completed
			userTask.completed = true;
			await userTask.save({ transaction: t });

			// Определяем тип награды и сумму
			const reward = task.reward || 0;
			const rewardType = task.condition?.rewardType || 'stardust';

			// Регистрируем награду через marketService
			await marketService.registerTaskReward({
				userId,
				taskId: task.id,
				amount: reward,
				currency: rewardType,
			});

			// Update user state
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState && userState.state) {
				// Update task counters
				userState.state.ownedTasksCount =
					(userState.state.ownedTasksCount || 0) + 1;

				await userState.save({ transaction: t });
			}

			await t.commit();
			return {
				task: userTask,
				slug: userTask.tasktemplate.slug,
				reward: task.reward,
				rewardType: rewardType,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to complete task: ${err.message}`);
		}
	}

	async getTaskProgress(userId, slug) {
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
			});

			if (!userTask) {
				throw ApiError.BadRequest('User task not found');
			}

			return {
				taskId: task.id,
				slug: userTask.tasktemplate.slug,
				progress: userTask.progress,
				targetProgress: userTask.targetProgress,
				completed: userTask.completed,
				progressPercentage:
					userTask.targetProgress > 0
						? (userTask.progress / userTask.targetProgress) * 100
						: 0,
				lastProgressUpdate: userTask.lastProgressUpdate,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get task progress: ${err.message}`
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

			// Calculate overall progress
			let totalProgress = 0;
			let totalTarget = 0;

			userTasks.forEach((task) => {
				if (task.active && !task.completed) {
					totalProgress += task.progress;
					totalTarget += task.targetProgress;
				}
			});

			const overallProgress =
				totalTarget > 0 ? (totalProgress / totalTarget) * 100 : 0;

			await t.commit();

			return {
				total: totalTasks,
				completed: completedTasks,
				active: activeTasks,
				overallProgress,
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
