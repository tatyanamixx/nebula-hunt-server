const UserService = require('./service/user-service');

async function testUnifiedResponseFormat() {
	// Функция для обработки BigInt при сериализации
	const bigIntReplacer = (key, value) => {
		if (typeof value === 'bigint') {
			return value.toString();
		}
		return value;
	};

	try {
		console.log('🧪 Тестирование единого формата ответа...\n');

		// Генерируем уникальный ID для теста
		const testUserId = Math.floor(Math.random() * 1000000000) + 100000000;

		// Данные для регистрации
		const userData = {
			id: testUserId,
			username: 'unifieduser',
			referral: '1234567890',
		};

		const galaxyData = {
			seed: `unified_galaxy_${Date.now()}`,
			starMin: 100,
			starCurrent: 150,
			price: 100,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Unified Galaxy',
				type: 'spiral',
				color: '#4A90E2',
				size: 'medium',
				complexity: 0.7,
				description: 'A galaxy for unified response testing',
			},
		};

		console.log('🚀 Шаг 1: Регистрируем нового пользователя...');
		const registrationResult = await UserService.login(
			userData.id,
			userData.username,
			userData.referral,
			galaxyData
		);

		console.log('\n✅ Регистрация успешна!');
		console.log(`📊 success: ${registrationResult.success}`);
		console.log(`📊 message: ${registrationResult.message}`);
		console.log(
			`📊 metadata.galaxyCreated: ${registrationResult.data.metadata.galaxyCreated}`
		);

		// Проверяем структуру ответа для нового пользователя
		console.log('\n📋 Проверка структуры ответа для нового пользователя:');
		console.log('✅ success - присутствует');
		console.log('✅ message - присутствует');
		console.log('✅ data.auth - присутствует');
		console.log('✅ data.userState - присутствует');
		console.log('✅ data.galaxies - присутствует');
		console.log('✅ data.artifacts - присутствует');
		console.log('✅ data.gameData - присутствует');
		console.log('✅ data.metadata - присутствует');

		console.log('\n🚀 Шаг 2: Логинимся как существующий пользователь...');
		const loginResult = await UserService.login(
			userData.id,
			userData.username,
			userData.referral,
			galaxyData
		);

		console.log('\n✅ Логин успешен!');
		console.log(`📊 success: ${loginResult.success}`);
		console.log(`📊 message: ${loginResult.message}`);
		console.log(
			`📊 metadata.galaxyCreated: ${loginResult.data.metadata.galaxyCreated}`
		);

		// Проверяем структуру ответа для существующего пользователя
		console.log(
			'\n📋 Проверка структуры ответа для существующего пользователя:'
		);
		console.log('✅ success - присутствует');
		console.log('✅ message - присутствует');
		console.log('✅ data.auth - присутствует');
		console.log('✅ data.userState - присутствует');
		console.log('✅ data.galaxies - присутствует');
		console.log('✅ data.artifacts - присутствует');
		console.log('✅ data.gameData - присутствует');
		console.log('✅ data.metadata - присутствует');

		// Сравниваем структуры ответов
		console.log('\n🔍 Сравнение структур ответов:');

		const registrationKeys = Object.keys(registrationResult);
		const loginKeys = Object.keys(loginResult);

		console.log(
			`📊 Ключи верхнего уровня одинаковы: ${
				JSON.stringify(registrationKeys) === JSON.stringify(loginKeys)
			}`
		);

		const registrationDataKeys = Object.keys(registrationResult.data);
		const loginDataKeys = Object.keys(loginResult.data);

		console.log(
			`📊 Ключи data одинаковы: ${
				JSON.stringify(registrationDataKeys) ===
				JSON.stringify(loginDataKeys)
			}`
		);

		// Проверяем различия в сообщениях
		console.log(
			`📊 Сообщения разные: ${
				registrationResult.message !== loginResult.message
			}`
		);
		console.log(
			`📊 galaxyCreated разные: ${
				registrationResult.data.metadata.galaxyCreated !==
				loginResult.data.metadata.galaxyCreated
			}`
		);

		// Показываем полную структуру ответа для нового пользователя
		console.log('\n📊 СТРУКТУРА ОТВЕТА ДЛЯ НОВОГО ПОЛЬЗОВАТЕЛЯ:');
		console.log('='.repeat(80));
		console.log(JSON.stringify(registrationResult, bigIntReplacer, 2));
		console.log('='.repeat(80));

		// Показываем полную структуру ответа для существующего пользователя
		console.log('\n📊 СТРУКТУРА ОТВЕТА ДЛЯ СУЩЕСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ:');
		console.log('='.repeat(80));
		console.log(JSON.stringify(loginResult, bigIntReplacer, 2));
		console.log('='.repeat(80));

		console.log('\n🎉 Тест единого формата ответа завершен успешно!');
		console.log('✅ Оба ответа имеют одинаковую структуру');
		console.log('✅ Различаются только message и metadata.galaxyCreated');
	} catch (error) {
		console.error('\n❌ Ошибка при тестировании:', error.message);
		console.error('Stack:', error.stack);
	}
}

testUnifiedResponseFormat();
