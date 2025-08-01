const UserService = require('./service/user-service');
const logger = require('./service/logger-service');

async function testExistingUserLogin() {
	// Функция для обработки BigInt при сериализации
	const bigIntReplacer = (key, value) => {
		if (typeof value === 'bigint') {
			return value.toString() + 'n';
		}
		return value;
	};

	try {
		console.log(
			'🧪 Тестирование логина уже зарегистрированного пользователя...\n'
		);

		// Генерируем уникальный ID для теста
		const testUserId = Math.floor(Math.random() * 1000000000) + 100000000;

		console.log(`📝 Тестовые данные:`);
		console.log(`  - userId: ${testUserId}`);

		// Данные для регистрации
		const userData = {
			id: testUserId,
			username: 'existinguser',
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

		console.log('\n🚀 Шаг 1: Регистрируем нового пользователя...');

		// Регистрируем пользователя с галактикой
		const registrationResult = await UserService.login(
			userData.id,
			userData.username,
			userData.referral,
			galaxyData
		);

		console.log('\n✅ Регистрация успешна!');
		console.log(`📊 galaxyCreated: ${registrationResult.galaxyCreated}`);
		console.log(
			`📊 galaxy: ${registrationResult.galaxy ? 'создана' : 'не создана'}`
		);

		// Проверяем, что пользователь создан
		if (registrationResult.user && registrationResult.user.id) {
			console.log(
				`✅ Пользователь создан с ID: ${registrationResult.user.id}`
			);
		}

		// Проверяем, что галактика создана
		if (registrationResult.galaxy && registrationResult.galaxy.id) {
			console.log(
				`✅ Галактика создана с ID: ${registrationResult.galaxy.id}`
			);
		}

		// Проверяем, что userState создан
		if (registrationResult.userState && registrationResult.userState.id) {
			console.log(
				`✅ UserState создан с ID: ${registrationResult.userState.id}`
			);
		}

		console.log(
			'\n🚀 Шаг 2: Пытаемся войти с теми же данными (логин существующего пользователя)...'
		);

		// Пытаемся войти с теми же данными (должен быть логин, а не регистрация)
		const loginResult = await UserService.login(
			userData.id,
			userData.username,
			userData.referral,
			galaxyData // Передаем galaxyData, но для существующего пользователя это не должно создавать новую галактику
		);

		console.log('\n✅ Логин существующего пользователя успешен!');
		console.log(`📊 galaxyCreated: ${loginResult.galaxyCreated}`);
		console.log(
			`📊 galaxy: ${loginResult.galaxy ? 'создана' : 'не создана'}`
		);

		// Проверяем, что пользователь тот же самый
		if (loginResult.user && loginResult.user.id) {
			console.log(`✅ Пользователь найден с ID: ${loginResult.user.id}`);
		}

		// Проверяем, что userState существует
		if (loginResult.userState && loginResult.userState.id) {
			console.log(
				`✅ UserState найден с ID: ${loginResult.userState.id}`
			);
		}

		// Проверяем, что галактики возвращаются (должны быть в массиве galaxies)
		if (loginResult.galaxies && Array.isArray(loginResult.galaxies)) {
			console.log(`✅ Найдено галактик: ${loginResult.galaxies.length}`);
			if (loginResult.galaxies.length > 0) {
				console.log(
					`✅ Первая галактика ID: ${loginResult.galaxies[0].id}`
				);
			}
		}

		// Проверяем, что артефакты возвращаются
		if (loginResult.artifacts && Array.isArray(loginResult.artifacts)) {
			console.log(
				`✅ Найдено артефактов: ${loginResult.artifacts.length}`
			);
		}

		// Проверяем данные инициализации
		console.log('\n📋 Проверка данных инициализации:');

		if (loginResult.data) {
			console.log('✅ Поле data присутствует');

			if (loginResult.data.upgradeTree) {
				console.log(
					`✅ upgradeTree: ${JSON.stringify(
						loginResult.data.upgradeTree,
						bigIntReplacer,
						2
					)}`
				);
			} else {
				console.log('❌ upgradeTree отсутствует');
			}

			if (loginResult.data.userEvents) {
				console.log(
					`✅ userEvents: ${JSON.stringify(
						loginResult.data.userEvents,
						bigIntReplacer,
						2
					)}`
				);
			} else {
				console.log('❌ userEvents отсутствует');
			}

			if (loginResult.data.userTasks) {
				console.log(
					`✅ userTasks: ${JSON.stringify(
						loginResult.data.userTasks,
						bigIntReplacer,
						2
					)}`
				);
			} else {
				console.log('❌ userTasks отсутствует');
			}

			if (loginResult.data.packageOffers) {
				console.log(
					`✅ packageOffers: ${JSON.stringify(
						loginResult.data.packageOffers,
						bigIntReplacer,
						2
					)}`
				);
			} else {
				console.log('❌ packageOffers отсутствует');
			}
		} else {
			console.log('❌ Поле data отсутствует');
		}

		// Сравниваем ID пользователей
		if (
			registrationResult.user.id === loginResult.user.id &&
			registrationResult.userState.id === loginResult.userState.id
		) {
			console.log(
				`✅ Подтверждено: это тот же самый пользователь и UserState`
			);
		}

		// Показываем полную структуру ответа
		console.log(
			'\n📊 Полная структура ответа для существующего пользователя:'
		);

		console.log(JSON.stringify(loginResult, bigIntReplacer, 2));

		console.log(
			'\n🎉 Тест логина существующего пользователя завершен успешно!'
		);
		console.log(loginResult);
	} catch (error) {
		console.error('\n❌ Ошибка при тестировании:', error.message);
		console.error('Stack:', error.stack);
	}
}

testExistingUserLogin();
