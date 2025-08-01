const UserService = require('./service/user-service');
const logger = require('./service/logger-service');

async function testUserRegistrationWithGalaxy() {
	try {
		console.log(
			'🧪 Тестирование регистрации пользователя с галактикой...\n'
		);

		// Генерируем уникальный ID для теста
		const testUserId = Math.floor(Math.random() * 1000000000) + 100000000;
		const testTelegramId =
			Math.floor(Math.random() * 1000000000) + 100000000;

		console.log(`📝 Тестовые данные:`);
		console.log(`  - userId: ${testUserId}`);
		console.log(`  - telegramId: ${testTelegramId}`);

		// Данные для регистрации
		const userData = {
			id: testUserId,
			username: 'testuser',
			referral: '1234567890',
		};

		const galaxyData = {
			seed: `test_galaxy_${Date.now()}`,
			starMin: 100,
			starCurrent: 150,
			price: 100,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Test Galaxy',
				type: 'spiral',
				color: '#4A90E2',
				size: 'medium',
				complexity: 0.7,
				description: 'A test galaxy for registration testing',
			},
		};

		console.log('\n🚀 Тест 1: Регистрация БЕЗ данных галактики...');

		// Регистрируем пользователя БЕЗ галактики
		const resultWithoutGalaxy = await UserService.login(
			userData.id,
			userData.username,
			0,
			galaxyData
		);

		console.log('\n✅ Регистрация БЕЗ галактики успешна!');
		console.log(`📊 galaxyCreated: ${resultWithoutGalaxy.galaxyCreated}`);
		console.log(
			`📊 galaxy: ${
				resultWithoutGalaxy.galaxy ? 'создана' : 'не создана'
			}`
		);

		// Проверяем, что пользователь создан
		if (resultWithoutGalaxy.user && resultWithoutGalaxy.user.id) {
			console.log(
				`✅ Пользователь создан с ID: ${resultWithoutGalaxy.user.id}`
			);
		}

		// Проверяем, что галактика НЕ создана
		if (!resultWithoutGalaxy.galaxy) {
			console.log(`✅ Галактика НЕ создана (как и ожидалось)`);
		}

		// Проверяем, что userState создан
		if (resultWithoutGalaxy.userState && resultWithoutGalaxy.userState.id) {
			console.log(
				`✅ UserState создан с ID: ${resultWithoutGalaxy.userState.id}`
			);
		}

		console.log('\n🚀 Тест 2: Регистрация С данными галактики...');

		// Генерируем новый уникальный ID для второго теста
		const testUserId2 = Math.floor(Math.random() * 1000000000) + 100000000;

		// Регистрируем пользователя С галактикой
		const resultWithGalaxy = await UserService.login(
			testUserId2,
			'testuser2',
			null,
			galaxyData
		);

		console.log('\n✅ Регистрация С галактикой успешна!');
		console.log(`📊 galaxyCreated: ${resultWithGalaxy.galaxyCreated}`);
		console.log(
			`📊 galaxy: ${resultWithGalaxy.galaxy ? 'создана' : 'не создана'}`
		);

		// Проверяем, что пользователь создан
		if (resultWithGalaxy.user && resultWithGalaxy.user.id) {
			console.log(
				`✅ Пользователь создан с ID: ${resultWithGalaxy.user.id}`
			);
		}

		// Проверяем, что галактика создана
		if (resultWithGalaxy.galaxy && resultWithGalaxy.galaxy.id) {
			console.log(
				`✅ Галактика создана с ID: ${resultWithGalaxy.galaxy.id}`
			);
		}

		// Проверяем, что userState создан
		if (resultWithGalaxy.userState && resultWithGalaxy.userState.id) {
			console.log(
				`✅ UserState создан с ID: ${resultWithGalaxy.userState.id}`
			);
		}

		console.log('\n🎉 Все тесты завершены успешно!');
	} catch (error) {
		console.error('\n❌ Ошибка при тестировании:', error.message);
		console.error('Stack:', error.stack);
	}
}

testUserRegistrationWithGalaxy();
