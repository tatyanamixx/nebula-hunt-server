const { UserTask, Task } = require('../models/models');
const ApiError = require('../exceptions/api-error');

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
			// Get all active tasks
			const taskRaw = await Task.findAll({
				where: {
					active: true,
				},
			});

			// Get user's existing tasks
			const userTaskRaw = await UserTask.findAll({
				where: {
					userId: userId,
				},
			});

			const tasks = taskRaw.map((item) => item.toJSON());
			if (tasks.length === 0) {
				return {
					reward: { task: 0 },
					task: [],
				};
			}

			const userTasks = userTaskRaw.map((item) => item.toJSON());
			const existingTaskIds = new Set(userTasks.map((ut) => ut.taskId));

			const newTasks = tasks.filter(
				(task) => !existingTaskIds.has(task.id)
			);

			if (newTasks.length > 0) {
				const newUserTasks = newTasks.map((task) => ({
					userId: userId,
					taskId: task.id,
					progress: 0,
					completed: false,
				}));

				await UserTask.bulkCreate(newUserTasks, {
					returning: true,
				});
			}

			const userTaskNew = await UserTask.findAll({
				where: {
					userId: userId,
				},
				include: Task,
			});

			// Calculate total reward
			const totalReward = await UserTask.sum('reward', {
				where: {
					userId: userId,
					completed: true,
				},
			});

			return {
				reward: { task: totalReward || 0 },
				task: userTaskNew.map((item) => item.toJSON()),
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to activate user tasks: ${err.message}`
			);
		}
	}

	async getUserTasks(userId) {
		try {
			// Get user's tasks with task details
			const userTasksRaw = await UserTask.findAll({
				include: Task,
				where: {
					userId: userId,
				},
				attributes: [
					'id',
					'userId',
					'taskId',
					'progress',
					'targetProgress',
					'completed',
					'reward',
					'progressHistory',
					'lastProgressUpdate',
					'task.id',
					'task.title',
					'task.description',
					'task.reward',
					'task.condition',
					'task.icon',
					'task.active',
				],
			});

			return userTasksRaw.map((item) => item.toJSON());
		} catch (err) {
			throw ApiError.Internal(`Failed to get user tasks: ${err.message}`);
		}
	}

	async updateTaskProgress(userId, taskId, progress) {
		try {
			const userTask = await UserTask.findOne({
				where: {
					userId: userId,
					taskId: taskId,
				},
				include: Task,
			});

			if (!userTask) {
				throw ApiError.BadRequest('Task not found');
			}

			// Update progress
			userTask.progress = Math.min(progress, userTask.targetProgress);

			// Check if task is completed
			if (
				userTask.progress >= userTask.targetProgress &&
				!userTask.completed
			) {
				userTask.completed = true;
				userTask.reward = userTask.task.reward;
			}

			// Update progress history
			userTask.progressHistory.push({
				timestamp: new Date(),
				progress: userTask.progress,
			});

			userTask.lastProgressUpdate = new Date();

			await userTask.save();

			return userTask.toJSON();
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
