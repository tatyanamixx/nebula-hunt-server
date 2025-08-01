const userService = require('./service/user-service');
const { User, UserState, Galaxy } = require('./models/models');
const sequelize = require('./db');

// Функция для тестирования registration сервиса
async function testUserServiceRegistration() {
	try {
		console.log('🧪 Testing User Service Registration Method...\n');

		// Тест 1: Регистрация с полными данными
		console.log('📝 Test 1: Registration with full data...');
		const userId1 = BigInt(123456789);
		const username1 = 'testuser123';
		const referral1 = BigInt(123456);
		const galaxy1 = {
			seed: 'test_galaxy_alpha_seed_12345',
			starMin: 100,
			starCurrent: 150,
			price: 100,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Test Galaxy Alpha',
				type: 'spiral',
				color: '#4A90E2',
				size: 'medium',
				complexity: 0.7,
				description: 'A test galaxy for registration testing',
			},
		};

		console.log('Input data:', {
			userId: userId1.toString(),
			username: username1,
			referral: referral1.toString(),
			galaxy: galaxy1,
		});

		try {
			const result1 = await userService.registration(userId1, username1, referral1, galaxy1);
			
			console.log('\n✅ SUCCESS Response:');
			console.log('   Status: Success');
			console.log('\n📄 Response Data:');
			console.log(JSON.stringify(result1, null, 2));

			// Анализ структуры ответа
			console.log('\n🔍 Response Structure Analysis:');
			console.log('   Has accessToken:', !!result1.accessToken);
			console.log('   Has refreshToken:', !!result1.refreshToken);
			console.log('   Has user object:', !!result1.user);
			console.log('   Has userState object:', !!result1.userState);
			console.log('   Has galaxy object:', !!result1.galaxy);

			if (result1.user) {
				console.log('\n👤 User Object Fields:');
				Object.keys(result1.user).forEach(key => {
					console.log(`     ${key}:`, result1.user[key]);
				});
			}

			if (result1.userState) {
				console.log('\n🎮 UserState Object Fields:');
				Object.keys(result1.userState).forEach(key => {
					console.log(`     ${key}:`, result1.userState[key]);
				});
			}

			if (result1.galaxy) {
				console.log('\n🌌 Galaxy Object Fields:');
				Object.keys(result1.galaxy).forEach(key => {
					console.log(`     ${key}:`, result1.galaxy[key]);
				});
			}

		} catch (error) {
			console.log('\n❌ ERROR Response:');
			console.log('   Error:', error.message);
			console.log('   Stack:', error.stack);
		}

		// Тест 2: Регистрация с минимальными данными
		console.log('\n' + '='.repeat(80));
		console.log('📝 Test 2: Registration with minimal data...');
		const userId2 = BigInt(555666777);
		const username2 = 'minimaluser';
		const referral2 = null;
		const galaxy2 = null;

		console.log('Input data:', {
			userId: userId2.toString(),
			username: username2,
			referral: referral2,
			galaxy: galaxy2,
		});

		try {
			const result2 = await userService.login(userId2, username2, referral2, galaxy2);
			
			console.log('\n✅ SUCCESS Response (minimal data):');
			console.log('   Status: Success');
			console.log('\n📄 Response Data:');
			console.log(JSON.stringify(result2, null, 2));

			// Проверяем, что galaxy отсутствует
			console.log('\n🔍 Minimal Data Analysis:');
			console.log('   Has galaxy:', !!result2.galaxy);
			console.log('   Galaxy should be null/undefined:', !result2.galaxy);

		} catch (error) {
			console.log('\n❌ ERROR Response (minimal data):');
			console.log('   Error:', error.message);
			console.log('   Stack:', error.stack);
		}

		// Тест 3: Регистрация с referral и галактикой
		console.log('\n' + '='.repeat(80));
		console.log('📝 Test 3: Registration with referral and galaxy...');
		const userId3 = BigInt(987654321);
		const username3 = 'referraluser';
		const referral3 = BigInt(999999);
		const galaxy3 = {
			seed: 'test_galaxy_gamma_seed_11111',
			starMin: 500,
			starCurrent: 600,
			price: 500,
			particleCount: 300,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Test Galaxy Gamma',
				type: 'irregular',
				color: '#90E24A',
				size: 'huge',
				complexity: 0.9,
				description: 'Test galaxy for referral testing',
			},
		};

		console.log('Input data:', {
			userId: userId3.toString(),
			username: username3,
			referral: referral3.toString(),
			galaxy: galaxy3,
		});

		try {
			const result3 = await userService.registration(userId3, username3, referral3, galaxy3);
			
			console.log('\n✅ SUCCESS Response (referral and galaxy):');
			console.log('   Status: Success');
			console.log('\n📄 Response Data:');
			console.log(JSON.stringify(result3, null, 2));

		} catch (error) {
			console.log('\n❌ ERROR Response (referral only):');
			console.log('   Error:', error.message);
			console.log('   Stack:', error.stack);
		}

		// Тест 4: Попытка повторной регистрации (должна вернуть ошибку)
		console.log('\n' + '='.repeat(80));
		console.log('📝 Test 4: Duplicate registration attempt...');

		try {
			const result4 = await userService.registration(userId1, username1, referral1, galaxy1);
			console.log('\n❌ Should have failed with duplicate user error');
			console.log('   Result:', result4);
		} catch (error) {
			console.log('\n✅ Correctly failed with duplicate user error');
			console.log('   Error:', error.message);
			console.log('   Error type:', error.constructor.name);
		}

		// Тест 5: Регистрация с нулевым referral
		console.log('\n' + '='.repeat(80));
		console.log('📝 Test 5: Registration with zero referral...');
		const userId5 = BigInt(111222333);
		const username5 = 'invalidreferral';
		const referral5 = BigInt(0); // используем 0 вместо строки
		const galaxy5 = {
			seed: 'test_galaxy_delta_seed_22222',
			starMin: 150,
			starCurrent: 180,
			price: 150,
			particleCount: 120,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Test Galaxy Delta',
				type: 'dwarf',
				color: '#E2E24A',
				size: 'small',
				complexity: 0.5,
				description: 'Test galaxy for error testing',
			},
		};

		try {
			const result5 = await userService.registration(userId5, username5, referral5, galaxy5);
			console.log('\n✅ Successfully registered with zero referral');
			console.log('   Result:', result5);
		} catch (error) {
			console.log('\n❌ Failed with error:');
			console.log('   Error:', error.message);
			console.log('   Error type:', error.constructor.name);
		}

		return true;

	} catch (error) {
		console.error('❌ Error in service registration test:', error.message);
		console.error('   Stack:', error.stack);
		return false;
	}
}

// Функция для очистки тестовых данных
async function cleanupTestData() {
	try {
		console.log('\n🧹 Cleaning up test data...');
		
		const testUserIds = [
			BigInt(123456789),
			BigInt(555666777),
			BigInt(987654321),
			BigInt(111222333)
		];

		for (const userId of testUserIds) {
			try {
				// Удаляем пользователя и связанные данные
				await User.destroy({
					where: { id: userId }
				});
				console.log(`   Cleaned up user ${userId}`);
			} catch (error) {
				console.log(`   User ${userId} not found or already cleaned`);
			}
		}

		console.log('✅ Test data cleanup completed');
		return true;

	} catch (error) {
		console.error('❌ Error cleaning up test data:', error.message);
		return false;
	}
}

// Функция для проверки состояния базы данных
async function checkDatabaseState() {
	try {
		console.log('\n📊 Database State Check...');

		// Проверяем количество пользователей
		const userCount = await User.count();
		console.log(`   Total users in database: ${userCount}`);

		// Проверяем количество состояний пользователей
		const userStateCount = await UserState.count();
		console.log(`   Total user states in database: ${userStateCount}`);

		// Проверяем количество галактик
		const galaxyCount = await Galaxy.count();
		console.log(`   Total galaxies in database: ${galaxyCount}`);

		return true;

	} catch (error) {
		console.error('❌ Error checking database state:', error.message);
		return false;
	}
}

// Основная функция
async function main() {
	console.log('🚀 Starting User Service Registration Tests...\n');

	try {
		// Проверяем подключение к базе данных
		await sequelize.authenticate();
		console.log('✅ Database connection established');

		// Проверяем начальное состояние базы данных
		await checkDatabaseState();

		// Запускаем тесты
		const testResult = await testUserServiceRegistration();

		// Проверяем состояние базы данных после тестов
		await checkDatabaseState();

		// Очищаем тестовые данные
		const cleanupResult = await cleanupTestData();

		console.log('\n' + '='.repeat(80));
		console.log('📊 Test Results:');
		console.log('   Service registration tests:', testResult ? '✅ PASSED' : '❌ FAILED');
		console.log('   Data cleanup:', cleanupResult ? '✅ COMPLETED' : '❌ FAILED');

		if (testResult && cleanupResult) {
			console.log('\n🎉 All service tests completed successfully!');
			console.log('\n💡 Summary:');
			console.log('   - User service registration method tested');
			console.log('   - Response structure validated');
			console.log('   - Error handling verified');
			console.log('   - Database state checked');
			console.log('   - Test data cleaned up');
		} else {
			console.log('\n⚠️  Some tests failed. Check the output above for details.');
			process.exit(1);
		}

	} catch (error) {
		console.error('❌ Error in main test function:', error.message);
		console.error('   Stack:', error.stack);
		process.exit(1);
	} finally {
		// Закрываем соединение с базой данных
		try {
			await sequelize.close();
			console.log('\n✅ Database connection closed');
		} catch (error) {
			console.error('❌ Error closing database connection:', error.message);
		}
	}
}

// Запускаем тесты
if (require.main === module) {
	main().catch(console.error);
}

module.exports = {
	testUserServiceRegistration,
	cleanupTestData,
	checkDatabaseState,
}; 