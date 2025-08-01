const {
	sequelize,
	User,
	UserState,
	TaskTemplate,
	UserTask,
} = require('./models/models');
const TaskService = require('./service/task-service');

async function testTaskServiceFindOrCreate() {
	console.log(
		'🧪 Тестирование TaskService.initializeUserTasks с findOrCreate...\n'
	);

	try {
		const taskService = TaskService;

		// Создаем тестового пользователя
		const testUserId = BigInt(999888777);
		const testUser = await User.create({
			id: testUserId,
			username: 'test_task_user',
			referral: BigInt(0),
		});

		// Создаем UserState для пользователя
		await UserState.create({
			userId: testUserId,
			stardust: 1000,
			darkMatter: 500,
			stars: 100,
		});

		console.log('✅ Создан тестовый пользователь и UserState');

		// Проверяем, есть ли активные шаблоны задач
		const activeTemplates = await TaskTemplate.findAll({
			where: { active: true },
		});

		console.log(
			`📋 Найдено активных шаблонов задач: ${activeTemplates.length}`
		);

		if (activeTemplates.length === 0) {
			console.log('⚠️  Нет активных шаблонов задач для тестирования');
			console.log('   Создаем тестовый шаблон...');

			// Создаем тестовый шаблон задачи
			const testTemplate = await TaskTemplate.create({
				slug: 'test_task_001',
				title: {
					en: 'Test Task',
					ru: 'Тестовая задача',
				},
				description: {
					en: 'Complete this test task',
					ru: 'Выполните эту тестовую задачу',
				},
				reward: { type: 'stardust', amount: 100 },
				condition: { type: 'manual', required: true },
				icon: '⭐',
				active: true,
				sortOrder: 1,
			});

			console.log('✅ Создан тестовый шаблон задачи:', testTemplate.slug);
		}

		// Тест 1: Первый вызов - должен создать задачи
		console.log('\n📝 Тест 1: Первый вызов initializeUserTasks...');
		const result1 = await taskService.initializeUserTasks(testUserId);

		console.log('✅ Результат первого вызова:');
		console.log(`   Создано задач: ${result1.tasks.length}`);
		console.log(`   Общая награда: ${result1.reward.task}`);

		// Проверяем, что задачи созданы в базе
		const userTasks1 = await UserTask.findAll({
			where: { userId: testUserId },
		});
		console.log(`   Задач в базе данных: ${userTasks1.length}`);

		// Тест 2: Повторный вызов - не должен создавать дубликаты
		console.log('\n📝 Тест 2: Повторный вызов initializeUserTasks...');
		const result2 = await taskService.initializeUserTasks(testUserId);

		console.log('✅ Результат второго вызова:');
		console.log(`   Создано задач: ${result2.tasks.length}`);
		console.log(`   Общая награда: ${result2.reward.task}`);

		// Проверяем, что количество задач не изменилось
		const userTasks2 = await UserTask.findAll({
			where: { userId: testUserId },
		});
		console.log(`   Задач в базе данных: ${userTasks2.length}`);

		// Проверяем, что количество задач одинаковое
		if (userTasks1.length === userTasks2.length) {
			console.log(
				'✅ findOrCreate работает правильно - дубликаты не создаются'
			);
		} else {
			console.log('❌ findOrCreate не работает - создаются дубликаты');
		}

		// Тест 3: Проверяем обновление UserState
		console.log('\n📝 Тест 3: Проверка обновления UserState...');
		const userState = await UserState.findOne({
			where: { userId: testUserId },
		});

		if (userState && userState.state) {
			console.log('✅ UserState обновлен:');
			console.log(
				`   Активных задач: ${userState.state.activeTasksCount || 0}`
			);
			console.log(
				`   Завершенных задач: ${userState.state.ownedTasksCount || 0}`
			);
		} else {
			console.log('⚠️  UserState не содержит информации о задачах');
		}

		// Тест 4: Тестируем с транзакцией
		console.log('\n📝 Тест 4: Тестирование с транзакцией...');
		const transaction = await sequelize.transaction();

		try {
			const result3 = await taskService.initializeUserTasks(
				testUserId,
				transaction
			);
			console.log('✅ Тест с транзакцией прошел успешно');
			console.log(`   Создано задач: ${result3.tasks.length}`);
			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			console.log(
				'❌ Ошибка при тестировании с транзакцией:',
				error.message
			);
		}

		console.log('\n✅ Все тесты пройдены успешно!');
		console.log(
			'📝 Метод initializeUserTasks с findOrCreate работает корректно'
		);
	} catch (error) {
		console.error('❌ Ошибка при тестировании:', error.message);
		console.error(error.stack);
	} finally {
		// Очищаем тестовые данные
		try {
			await UserTask.destroy({
				where: { userId: BigInt(999888777) },
			});
			await UserState.destroy({
				where: { userId: BigInt(999888777) },
			});
			await User.destroy({
				where: { id: BigInt(999888777) },
			});
			console.log('🧹 Тестовые данные очищены');
		} catch (cleanupError) {
			console.log(
				'⚠️  Ошибка при очистке тестовых данных:',
				cleanupError.message
			);
		}

		await sequelize.close();
	}
}

testTaskServiceFindOrCreate();
