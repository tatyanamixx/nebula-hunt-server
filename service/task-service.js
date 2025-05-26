const {
	UserTask,
	Task,
	TaskConnection,
	UserState,
} = require('../models/models');

const ApiError = require('../exceptions/api-error');
const { where, Op } = require('sequelize');

class TaskService {
	async createTasks(tasks) {
		try {
			// Create or update tasks
			for (let i = 0; i < tasks.length; i++) {
				let task = await Task.findOne({
					where: { keyWord: tasks[i].keyWord },
				});
				if (task) {
					task.description = tasks[i].description;
					task.reward = tasks[i].reward;
					task.active = tasks[i].active;
					task.conditions = tasks[i].conditions || {};
					task.weight = tasks[i].weight || 1;
					await task.save();
				} else {
					task = await Task.create({
						keyWord: tasks[i].keyWord,
						description: tasks[i].description,
						reward: tasks[i].reward,
						active: tasks[i].active,
						conditions: tasks[i].conditions || {},
						weight: tasks[i].weight || 1,
					});
				}

				// Handle task connections if specified
				if (tasks[i].connections) {
					for (const conn of tasks[i].connections) {
						const toTask = await Task.findOne({
							where: { keyWord: conn.toTaskKey },
						});
						if (toTask) {
							await TaskConnection.findOrCreate({
								where: {
									fromTaskId: task.id,
									toTaskId: toTask.id,
								},
								defaults: {
									requiredWeight: conn.requiredWeight || 0,
								},
							});
						}
					}
				}
			}
			const tasksRaw = await Task.findAll({
				include: [
					{
						model: TaskConnection,
						as: 'outgoingConnections',
						include: [
							{
								model: Task,
								as: 'toTask',
							},
						],
					},
				],
			});
			const newTasks = tasksRaw.map((item) => item.toJSON());
			return { tasks: newTasks };
		} catch (err) {
			throw ApiError.Internal(err.message);
		}
	}

	async activateUserTasks(userId) {
		try {
			const userState = await UserState.findOne({
				where: { userId: userId },
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			const taskProgress = userState.taskProgress || {
				completedTasks: [],
				currentWeight: 0,
				unlockedNodes: [],
			};

			// Find all active tasks that are either root nodes (no incoming connections)
			// or have all required conditions met
			const availableTasks = await Task.findAll({
				where: { active: true },
				include: [
					{
						model: TaskConnection,
						as: 'incomingConnections',
						required: false,
					},
				],
			});

			const unlockedTasks = availableTasks.filter((task) => {
				// Root nodes (no incoming connections)
				if (task.incomingConnections.length === 0) {
					return true;
				}

				// Check if task is already unlocked
				if (taskProgress.unlockedNodes.includes(task.id)) {
					return true;
				}

				// Check if user has enough weight and completed required tasks
				return task.incomingConnections.every(
					(conn) =>
						taskProgress.currentWeight >= conn.requiredWeight &&
						taskProgress.completedTasks.includes(conn.fromTaskId)
				);
			});

			// Create UserTask entries for newly unlocked tasks
			for (const task of unlockedTasks) {
				await UserTask.findOrCreate({
					where: { userId: userId, taskId: task.id },
				});
			}

			// Update unlocked nodes in user state
			taskProgress.unlockedNodes = [
				...new Set([
					...taskProgress.unlockedNodes,
					...unlockedTasks.map((t) => t.id),
				]),
			];
			userState.taskProgress = taskProgress;
			await userState.save();

			const userTasksNew = await UserTask.findAll({
				where: { userId: userId },
				include: [Task],
			});

			const tasksNew = userTasksNew.map((item) => item.toJSON());
			const reward = await UserTask.sum('reward', {
				where: { userId: userId },
			});

			return {
				reward: { task: reward },
				userTasks: tasksNew,
				taskProgress: taskProgress,
			};
		} catch (err) {
			throw ApiError.Internal(err.message);
		}
	}

	async getUserTasks(userId) {
		try {
			const userTasksRaw = await UserTask.findAll({
				include: [
					{
						model: Task,
						include: [
							{
								model: TaskConnection,
								as: 'outgoingConnections',
								include: [
									{
										model: Task,
										as: 'toTask',
									},
								],
							},
						],
					},
				],
				where: { userId: userId },
				attributes: ['reward', 'completed'],
			});

			const userState = await UserState.findOne({
				where: { userId: userId },
			});

			const reward = await UserTask.sum('reward', {
				where: { userId: userId },
			});

			const userTasks = userTasksRaw.map((item) => item.toJSON());
			return {
				reward: { task: reward },
				tasks: userTasks,
				taskProgress: userState.taskProgress,
			};
		} catch (err) {
			throw ApiError.BadRequest(err.message);
		}
	}

	async completedUserTask(userId, taskId) {
		try {
			const task = await Task.findByPk(taskId);
			const userTask = await UserTask.findOne({
				where: { userId: userId, taskId: taskId },
			});
			const userState = await UserState.findOne({
				where: { userId: userId },
			});

			if (!task || !userTask || !userState) {
				throw ApiError.BadRequest('Task or user state not found');
			}

			// Check if conditions are met
			if (Object.keys(task.conditions).length > 0) {
				// Here you would implement the logic to check task conditions
				// based on your specific condition types
				// For example:
				// if (!checkTaskConditions(task.conditions, userState)) {
				//     throw ApiError.BadRequest('Task conditions not met');
				// }
			}

			userTask.reward = task.reward;
			userTask.completed = true;
			await userTask.save();

			// Update user's task progress
			const taskProgress = userState.taskProgress || {
				completedTasks: [],
				currentWeight: 0,
				unlockedNodes: [],
			};

			taskProgress.completedTasks.push(taskId);
			taskProgress.currentWeight += task.weight;
			userState.taskProgress = taskProgress;
			await userState.save();

			// Recalculate total reward
			const reward = await UserTask.sum('reward', {
				where: { userId: userId },
			});

			return {
				reward: { task: reward },
				taskProgress: taskProgress,
			};
		} catch (err) {
			throw ApiError.BadRequest(err.message);
		}
	}
}

module.exports = new TaskService();
