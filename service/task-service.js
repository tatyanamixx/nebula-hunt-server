const { UserTask, Task } = require('../models/models');

const ApiError = require('../exceptions/api-error');
const { where } = require('sequelize');

class TaskService {
	async userActiveTasks(userId) {
		const { count, activeTask } = await Task.findAndCountAll({
			where: { active: true },
		});

		if (!activeTask) return null;
		for (i = 0; i < count; i++) {
			await UserTask.findOrCreate({
				where: { userId: userId, taskId: activeTask[i] },
			});
		}
		const totalReward = await UserTask.sum('reward', {
			where: { userId: userId },
		});
		const userTasks = await UserTask.findAll({
			include: Task,
			where: { userId: userId },
		});

		return { totalReward: totalReward, userTasks };
	}

	async completedTask(userId, taskId) {
		const reward = await Task.findByPk(taskId);
		const task = await UserTask.findOne({
			where: { userId: userId, taskId: taskId },
		});
		if (!task) return null;
		if (!reward) return null;
		task.reward = reward.reward;
		task.save();
		return task;
	}
}
module.exports = new TaskService();
