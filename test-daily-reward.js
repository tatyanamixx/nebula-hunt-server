/**
 * Тест ежедневной награды
 */
const sequelize = require('./db');
const gameService = require('./service/game-service');
const userStateService = require('./service/user-state-service');

async function testDailyReward() {
	try {
		console.log('🧪 Testing daily reward system...');

		// Тестовый пользователь ID (не системный пользователь)
		const userId = 999999997;

		console.log('✅ Test data prepared');
		console.log('User ID:', userId);

		// Проверяем текущее состояние пользователя
		const userState = await userStateService.getUserState(userId);
		console.log('Current user state:', {
			userId: userState.userId,
			stardust: userState.stardust,
			darkMatter: userState.darkMatter,
			stars: userState.stars,
			lastDailyBonus: userState.lastDailyBonus,
			currentStreak: userState.currentStreak,
			maxStreak: userState.maxStreak,
		});

		// Проверяем задачи пользователя
		const { UserTask, TaskTemplate } = require('./models/models');

		// Get daily task templates first
		const dailyTaskTemplates = await TaskTemplate.findAll({
			where: {
				slug: {
					[require('sequelize').Op.in]: [
						'daily_login_stardust',
						'daily_login_darkmatter',
					],
				},
				active: true,
			},
		});

		// Get user tasks for these templates
		const userTasks = [];
		for (const template of dailyTaskTemplates) {
			const userTask = await UserTask.findOne({
				where: {
					userId: userId,
					taskTemplateId: template.id,
					active: true,
				},
			});

			if (userTask) {
				// Add template data to userTask
				userTask.TaskTemplate = template;
				userTasks.push(userTask);
			}
		}

		console.log('Daily task templates count:', dailyTaskTemplates.length);
		console.log(
			'Daily task templates:',
			dailyTaskTemplates.map((t) => ({
				id: t.id,
				slug: t.slug,
				title: t.title,
				condition: t.condition,
				reward: t.reward,
			}))
		);

		console.log(
			'User daily tasks:',
			userTasks.map((task) => ({
				slug: task.TaskTemplate?.slug || 'unknown',
				title: task.TaskTemplate?.title || 'unknown',
				condition: task.TaskTemplate?.condition || {},
				reward: task.TaskTemplate?.reward || {},
				completed: task.completed,
			}))
		);

		// Пытаемся получить ежедневную награду
		console.log('🎁 Attempting to claim daily reward...');
		const result = await gameService.claimDailyReward(userId);

		console.log('✅ Daily reward claimed successfully');
		console.log('Result:', {
			success: result.success,
			message: result.message,
			currentStreak: result.data.currentStreak,
			maxStreak: result.data.maxStreak,
			rewards: result.data.rewards,
			userState: result.data.userState,
		});

		// Проверяем обновленное состояние пользователя
		const updatedUserState = await userStateService.getUserState(userId);
		console.log('Updated user state:', {
			userId: updatedUserState.userId,
			stardust: updatedUserState.stardust,
			darkMatter: updatedUserState.darkMatter,
			stars: updatedUserState.stars,
			lastDailyBonus: updatedUserState.lastDailyBonus,
			currentStreak: updatedUserState.currentStreak,
			maxStreak: updatedUserState.maxStreak,
		});

		console.log('✅ Test completed successfully');
	} catch (error) {
		console.error('❌ Test failed:', error.message);
		if (error.code) {
			console.error('Error code:', error.code);
		}
		console.error('Stack trace:', error.stack);
	} finally {
		await sequelize.close();
	}
}

// Запускаем тест
testDailyReward();
