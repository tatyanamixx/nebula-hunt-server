const { UserTask, Task } = require('../models/models');

const ApiError = require('../exceptions/api-error');
const { where } = require('sequelize');

class TaskService {
	async createTasks(tasks) {
		try {
			console.log(tasks.length);
			for (let i = 0; i < tasks.length; i++) {
				let task = await Task.findOne({
					where: { keyWord: tasks[i].keyWord },
				});
				if (task) {
					task.description = tasks[i].description;
					task.reward = tasks[i].reward;
					task.active = tasks[i].active;
					task.save();
				} else {
					let tskc = await Task.create({
						keyWord: tasks[i].keyWord,
						description: tasks[i].description,
						reward: tasks[i].reward,
						active: tasks[i].active,
					});
				}
			}
			const tasksRaw = await Task.findAll();
			const newTasks = tasksRaw.map((item) => item.toJSON());
			return { tasks: newTasks };
		} catch (err) {
			ApiError.Internal(err.message);
		}
	}

	async activateUserTasks(userId) {
		try {
			const tasksRaw = await Task.findAll({
				where: { active: true },
			});
			const userTasksRaw = await UserTask.findAll({
				where: { userId: userId },
			});

			const tasks = tasksRaw.map((item) => item.toJSON());
			if (!tasks) return null;

			const userTasks = userTasksRaw.map((item) => item.toJSON());

			if (userTasks) {
				if (userTasks.length >= 0) {
					for (let i = 0; i < userTasks.length; i++) {
						let index = tasks.findIndex(
							(item) => item.id == userTasks[i].taskId
						);
						if (index > -1) {
							tasks.splice(index, 1);
						}
					}
				}
			}

			if (tasks.length > 0) {
				for (let i = 0; i < tasks.length; i++) {
					await UserTask.create({
						userId: userId,
						taskId: tasks[i].id,
					});
				}
			}
			const userTasksNew = await UserTask.findAll({
				where: { userId: userId },
			});

			const tasksNew = userTasksNew.map((item) => item.toJSON());

			const reward = await UserTask.sum('reward', {
				where: { userId: userId },
			});

			return { reward: { task: reward }, userTasks: tasksNew };
		} catch (err) {
			ApiError.Internal(err.message);
		}
	}

	async getUserTasks(userId) {
		try {
			const userTasksRaw = await UserTask.findAll({
				include: Task,
				where: { userId: userId },
				attributes: ['reward', 'completed', 'task.reward'],
			});
			const reward = await UserTask.sum('reward', {
				where: { userId: userId },
			});
			const userTasks = userTasksRaw.map((item) => item.toJSON());
			return { reward: { task: reward }, tasks: userTasks };
		} catch (err) {
			ApiError.BadRequest(err.message);
		}
	}

	async completedUserTask(userId, taskId) {
		try {
			const task = await Task.findByPk(taskId);
			const userTask = await UserTask.findOne({
				where: { userId: userId, taskId: taskId },
			});
			if (!task) return null;
			if (!userTask) return null;
			userTask.reward = task.reward;
			userTask.completed = true;
			userTask.save();
			const userTaskRaw = await UserTask.findAll({
				where: { userId: userId },
			});
			const reward = await UserTask.sum('reward', {
				where: { userId: userId },
			});
			return { reward: { task: reward } };
		} catch (err) {
			ApiError.BadRequest(err.message);
		}
	}
}
module.exports = new TaskService();
