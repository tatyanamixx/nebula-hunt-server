/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const { Task, UserState } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');

class TaskService {
	async createTasks(tasks) {
		try {
			// Create tasks in bulk
			const createdTasks = [];

			for (const task of tasks) {
				// Validate task data
				if (
					!task.id ||
					!task.title ||
					!task.description ||
					!task.reward ||
					!task.condition ||
					!task.icon
				) {
					throw ApiError.BadRequest('Invalid task data structure');
				}

				// Create task with levels included
				const newTask = await Task.create({
					id: task.id,
					title: task.title,
					description: task.description,
					reward: task.reward,
					condition: task.condition,
					icon: task.icon,
					active: task.active ?? true,
				});

				createdTasks.push(newTask);
			}

			return createdTasks;
		} catch (err) {
			throw ApiError.Internal(`Failed to create tasks: ${err.message}`);
		}
	}

	async activateUserTasks(userId) {
		try {
			// Получаем все активные задачи
			const taskRaw = await Task.findAll({
				where: {
					active: true,
				},
			});

			// Получаем состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем поля задач, если их нет
			if (!userState.userTasks) userState.userTasks = {};
			if (!userState.activeTasks) userState.activeTasks = [];
			if (!userState.completedTasks) userState.completedTasks = [];

			const tasks = taskRaw.map((item) => item.toJSON());
			if (tasks.length === 0) {
				return {
					reward: { task: 0 },
					task: [],
				};
			}

			// Получаем существующие задачи пользователя
			const existingTaskIds = new Set(Object.keys(userState.userTasks));

			// Фильтруем новые задачи
			const newTasks = tasks.filter(
				(task) => !existingTaskIds.has(task.id)
			);

			// Создаем записи для новых задач
			for (const task of newTasks) {
				userState.userTasks[task.id] = {
					progress: 0,
					targetProgress: task.condition?.targetProgress || 100,
					completed: false,
					reward: 0,
					progressHistory: [],
					lastProgressUpdate: new Date(),
				};

				// Добавляем в активные задачи
				if (!userState.activeTasks.includes(task.id)) {
					userState.activeTasks.push(task.id);
				}
			}

			await userState.save();

			// Вычисляем общую награду
			const totalReward = Object.values(userState.userTasks)
				.filter((task) => task.completed)
				.reduce((sum, task) => sum + (task.reward || 0), 0);

			// Формируем результат с информацией о задачах
			const userTasksWithDetails = [];
			for (const [taskId, taskData] of Object.entries(
				userState.userTasks
			)) {
				const taskInfo = tasks.find((t) => t.id === taskId);
				if (taskInfo) {
					userTasksWithDetails.push({
						id: taskId,
						userId: userId,
						taskId: taskId,
						progress: taskData.progress,
						targetProgress: taskData.targetProgress,
						completed: taskData.completed,
						reward: taskData.reward,
						progressHistory: taskData.progressHistory,
						lastProgressUpdate: taskData.lastProgressUpdate,
						task: taskInfo,
					});
				}
			}

			return {
				reward: { task: totalReward },
				task: userTasksWithDetails,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to activate user tasks: ${err.message}`
			);
		}
	}

	async getUserTasks(userId) {
		try {
			// Получаем состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState || !userState.userTasks) {
				return [];
			}

			const userTasks = [];
			const userTasksData = userState.userTasks;

			// Получаем информацию о каждой задаче
			for (const [taskId, taskData] of Object.entries(userTasksData)) {
				const task = await Task.findByPk(taskId);
				if (task) {
					userTasks.push({
						id: taskId,
						userId: userId,
						taskId: taskId,
						progress: taskData.progress,
						targetProgress: taskData.targetProgress,
						completed: taskData.completed,
						reward: taskData.reward,
						progressHistory: taskData.progressHistory,
						lastProgressUpdate: taskData.lastProgressUpdate,
						task: {
							id: task.id,
							title: task.title,
							description: task.description,
							reward: task.reward,
							condition: task.condition,
							icon: task.icon,
							active: task.active,
						},
					});
				}
			}

			return userTasks;
		} catch (err) {
			throw ApiError.Internal(`Failed to get user tasks: ${err.message}`);
		}
	}

	async updateTaskProgress(userId, taskId, progress) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (
				!userState ||
				!userState.userTasks ||
				!userState.userTasks[taskId]
			) {
				throw ApiError.BadRequest('Task not found');
			}

			const task = await Task.findByPk(taskId);
			if (!task) {
				throw ApiError.BadRequest('Task not found');
			}

			const userTask = userState.userTasks[taskId];

			// Обновляем прогресс
			userTask.progress = Math.min(progress, userTask.targetProgress);

			// Проверяем, завершена ли задача
			if (
				userTask.progress >= userTask.targetProgress &&
				!userTask.completed
			) {
				userTask.completed = true;
				userTask.reward = task.reward;

				// Добавляем в завершенные задачи
				if (!userState.completedTasks.includes(taskId)) {
					userState.completedTasks.push(taskId);
				}

				// Удаляем из активных задач
				userState.activeTasks = userState.activeTasks.filter(
					(id) => id !== taskId
				);
			}

			// Обновляем историю прогресса
			userTask.progressHistory.push({
				timestamp: new Date(),
				progress: userTask.progress,
			});

			userTask.lastProgressUpdate = new Date();

			await userState.save();

			return {
				id: taskId,
				userId: userId,
				taskId: taskId,
				progress: userTask.progress,
				targetProgress: userTask.targetProgress,
				completed: userTask.completed,
				reward: userTask.reward,
				progressHistory: userTask.progressHistory,
				lastProgressUpdate: userTask.lastProgressUpdate,
				task: {
					id: task.id,
					title: task.title,
					description: task.description,
					reward: task.reward,
					condition: task.condition,
					icon: task.icon,
					active: task.active,
				},
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to update task progress: ${err.message}`
			);
		}
	}

	async updateTask(taskId, taskData) {
		try {
			const task = await Task.findOne({
				where: {
					id: taskId,
				},
			});

			if (!task) {
				throw ApiError.BadRequest('Task not found');
			}

			// Update task data
			Object.assign(task, taskData);
			await task.save();

			return task.toJSON();
		} catch (err) {
			throw ApiError.Internal(`Failed to update task: ${err.message}`);
		}
	}
}

module.exports = new TaskService();
