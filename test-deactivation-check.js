const UserService = require('./service/user-service');
const {
	UpgradeNodeTemplate,
	TaskTemplate,
	EventTemplate,
	PackageTemplate,
} = require('./models/models');
const sequelize = require('./db');

async function testDeactivationCheck() {
	const transaction = await sequelize.transaction();

	try {
		console.log('🧪 Тестирование проверки деактивации элементов...\n');

		// Генерируем уникальный ID для теста
		const testUserId = Math.floor(Math.random() * 1000000000) + 100000000;

		console.log(
			'🚀 Шаг 1: Регистрируем пользователя с активными элементами...'
		);

		// Регистрируем пользователя
		const registrationResult = await UserService.login(
			testUserId,
			'deactivationuser',
			'1234567890',
			{
				seed: `deactivation_galaxy_${Date.now()}`,
				starMin: 100,
				starCurrent: 150,
				price: 100,
				particleCount: 100,
				onParticleCountChange: true,
				galaxyProperties: {
					name: 'Deactivation Test Galaxy',
					type: 'spiral',
					color: '#4A90E2',
					size: 'medium',
					complexity: 0.7,
					description: 'A galaxy for deactivation testing',
				},
			}
		);

		console.log('✅ Пользователь зарегистрирован');
		console.log(
			`📊 Количество апгрейдов: ${
				registrationResult.data.gameData.upgradeTree.initialized
					.length +
				registrationResult.data.gameData.upgradeTree.activated.length
			}`
		);
		console.log(
			`📊 Количество задач: ${registrationResult.data.gameData.userTasks.tasks.length}`
		);
		console.log(
			`📊 Количество событий: ${
				registrationResult.data.gameData.userEvents ? 1 : 0
			}`
		);
		console.log(
			`📊 Количество пакетов: ${registrationResult.data.gameData.packageOffers.length}`
		);

		console.log('\n🚀 Шаг 2: Деактивируем некоторые шаблоны...');

		// Деактивируем первый апгрейд
		await UpgradeNodeTemplate.update(
			{ active: false },
			{
				where: { id: 1 }, // stardust_production
				transaction,
			}
		);
		console.log('✅ Деактивирован апгрейд stardust_production');

		// Деактивируем первую задачу
		await TaskTemplate.update(
			{ active: false },
			{
				where: { id: 1 }, // create_stars_100
				transaction,
			}
		);
		console.log('✅ Деактивирована задача create_stars_100');

		// Деактивируем первое событие
		await EventTemplate.update(
			{ active: false },
			{
				where: { id: 1 }, // supernova_bonus
				transaction,
			}
		);
		console.log('✅ Деактивировано событие supernova_bonus');

		// Деактивируем первый пакет
		await PackageTemplate.update(
			{ status: false },
			{
				where: { id: 1 }, // tiny_stardust
				transaction,
			}
		);
		console.log('✅ Деактивирован пакет tiny_stardust');

		// Коммитим изменения деактивации
		await transaction.commit();
		console.log('✅ Изменения деактивации зафиксированы');

		console.log(
			'\n🚀 Шаг 3: Логинимся снова и проверяем, что деактивированные элементы НЕ возвращаются...'
		);

		const loginResult = await UserService.login(
			testUserId,
			'deactivationuser',
			'1234567890'
		);

		console.log('\n📊 Результаты после деактивации:');
		console.log(
			`📊 Количество апгрейдов: ${
				loginResult.data.gameData.upgradeTree.initialized.length +
				loginResult.data.gameData.upgradeTree.activated.length
			}`
		);
		console.log(
			`📊 Количество задач: ${loginResult.data.gameData.userTasks.tasks.length}`
		);
		console.log(
			`📊 Количество событий: ${
				loginResult.data.gameData.userEvents ? 1 : 0
			}`
		);
		console.log(
			`📊 Количество пакетов: ${loginResult.data.gameData.packageOffers.length}`
		);

		// Проверяем, что деактивированные элементы не возвращаются
		const stardustUpgrade =
			loginResult.data.gameData.upgradeTree.initialized.find(
				(u) => u.slug === 'stardust_production'
			);
		const createStarsTask = loginResult.data.gameData.userTasks.tasks.find(
			(t) => t.slug === 'create_stars_100'
		);
		const tinyPackage = loginResult.data.gameData.packageOffers.find(
			(p) => p.package.slug === 'tiny_stardust'
		);

		console.log('\n🔍 Проверка деактивированных элементов:');
		console.log(
			`❌ stardust_production апгрейд: ${
				stardustUpgrade ? 'НАЙДЕН (ОШИБКА!)' : 'НЕ НАЙДЕН (ПРАВИЛЬНО)'
			}`
		);
		console.log(
			`❌ create_stars_100 задача: ${
				createStarsTask ? 'НАЙДЕНА (ОШИБКА!)' : 'НЕ НАЙДЕНА (ПРАВИЛЬНО)'
			}`
		);
		console.log(
			`❌ tiny_stardust пакет: ${
				tinyPackage ? 'НАЙДЕН (ОШИБКА!)' : 'НЕ НАЙДЕН (ПРАВИЛЬНО)'
			}`
		);

		// Проверяем, что активные элементы все еще возвращаются
		const starEfficiencyUpgrade =
			loginResult.data.gameData.upgradeTree.initialized.find(
				(u) => u.slug === 'star_effeciency'
			);
		const createStars1000Task =
			loginResult.data.gameData.userTasks.tasks.find(
				(t) => t.slug === 'create_stars_1000'
			);
		const smallPackage = loginResult.data.gameData.packageOffers.find(
			(p) => p.package.slug === 'small_stardust'
		);

		console.log('\n✅ Проверка активных элементов:');
		console.log(
			`✅ star_effeciency апгрейд: ${
				starEfficiencyUpgrade
					? 'НАЙДЕН (ПРАВИЛЬНО)'
					: 'НЕ НАЙДЕН (ОШИБКА!)'
			}`
		);
		console.log(
			`✅ create_stars_1000 задача: ${
				createStars1000Task
					? 'НАЙДЕНА (ПРАВИЛЬНО)'
					: 'НЕ НАЙДЕНА (ОШИБКА!)'
			}`
		);
		console.log(
			`✅ small_stardust пакет: ${
				smallPackage ? 'НАЙДЕН (ПРАВИЛЬНО)' : 'НЕ НАЙДЕН (ОШИБКА!)'
			}`
		);

		// Активируем обратно для очистки
		await UpgradeNodeTemplate.update(
			{ active: true },
			{ where: { id: 1 } }
		);
		await TaskTemplate.update({ active: true }, { where: { id: 1 } });
		await EventTemplate.update({ active: true }, { where: { id: 1 } });
		await PackageTemplate.update({ status: true }, { where: { id: 1 } });

		console.log('\n🎉 Тест завершен!');
		console.log(
			'⚠️  ВНИМАНИЕ: Если деактивированные элементы найдены, это означает, что сервисы НЕ проверяют деактивацию!'
		);
	} catch (error) {
		console.error('\n❌ Ошибка при тестировании:', error.message);
		console.error('Stack:', error.stack);
		if (!transaction.finished) {
			await transaction.rollback();
		}
	}
}

testDeactivationCheck();
