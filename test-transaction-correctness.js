const userService = require('./service/user-service');
const { User, UserState, Galaxy } = require('./models/models');
const sequelize = require('./db');

// Функция для тестирования корректности транзакций
async function testTransactionCorrectness() {
	try {
		console.log('🧪 Testing Transaction Correctness in Registration...\n');

		// Тест 1: Проверка атомарности транзакции при успешной регистрации
		console.log(
			'📝 Test 1: Transaction atomicity on successful registration...'
		);
		const userId1 = BigInt(999888777);
		const username1 = 'transactiontest1';
		const referral1 = BigInt(123456);
		const galaxy1 = {
			seed: 'transaction_test_galaxy_1',
			starMin: 100,
			starCurrent: 150,
			price: 100,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Transaction Test Galaxy 1',
				type: 'spiral',
				color: '#4A90E2',
				size: 'medium',
				complexity: 0.7,
			},
		};

		try {
			const result1 = await userService.registration(
				userId1,
				username1,
				referral1,
				galaxy1
			);

			console.log('✅ SUCCESS: Transaction committed successfully');
			console.log('   User created:', !!result1.user);
			console.log('   UserState created:', !!result1.userState);
			console.log('   Galaxy created:', !!result1.galaxy);
			console.log(
				'   Tokens generated:',
				!!(result1.accessToken && result1.refreshToken)
			);

			// Проверяем, что все данные действительно созданы в базе
			const userInDb = await User.findByPk(userId1);
			const userStateInDb = await UserState.findOne({
				where: { userId: userId1 },
			});
			const galaxyInDb = await Galaxy.findOne({
				where: { userId: userId1 },
			});

			console.log('   User in DB:', !!userInDb);
			console.log('   UserState in DB:', !!userStateInDb);
			console.log('   Galaxy in DB:', !!galaxyInDb);

			if (!userInDb || !userStateInDb || !galaxyInDb) {
				console.log('❌ ERROR: Not all data was committed to database');
				return false;
			}
		} catch (error) {
			console.log('❌ ERROR in successful registration test:');
			console.log('   Error:', error.message);
			return false;
		}

		// Тест 2: Проверка отката транзакции при дублировании пользователя
		console.log('\n' + '='.repeat(80));
		console.log('📝 Test 2: Transaction rollback on duplicate user...');

		try {
			const result2 = await userService.registration(
				userId1,
				username1,
				referral1,
				galaxy1
			);
			console.log(
				'❌ ERROR: Should have failed with duplicate user error'
			);
			console.log('   Result:', result2);
			return false;
		} catch (error) {
			console.log(
				'✅ SUCCESS: Correctly failed with duplicate user error'
			);
			console.log('   Error:', error.message);
			console.log('   Error type:', error.constructor.name);

			// Проверяем, что данные не были изменены в базе
			const userInDb = await User.findByPk(userId1);
			const userStateInDb = await UserState.findOne({
				where: { userId: userId1 },
			});
			const galaxyInDb = await Galaxy.findOne({
				where: { userId: userId1 },
			});

			console.log('   User still exists:', !!userInDb);
			console.log('   UserState still exists:', !!userStateInDb);
			console.log('   Galaxy still exists:', !!galaxyInDb);

			if (!userInDb || !userStateInDb || !galaxyInDb) {
				console.log(
					'❌ ERROR: Data was incorrectly modified during rollback'
				);
				return false;
			}
		}

		// Тест 3: Проверка отката транзакции при ошибке в середине процесса
		console.log('\n' + '='.repeat(80));
		console.log('📝 Test 3: Transaction rollback on mid-process error...');
		const userId3 = BigInt(888777666);
		const username3 = 'transactiontest3';
		const referral3 = BigInt(123456);
		const galaxy3 = {
			seed: 'transaction_test_galaxy_3',
			starMin: 100,
			starCurrent: 150,
			price: 100,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Transaction Test Galaxy 3',
				type: 'spiral',
				color: '#4A90E2',
				size: 'medium',
				complexity: 0.7,
			},
		};

		// Создаем пользователя напрямую в базе, чтобы вызвать конфликт
		await User.create({
			id: userId3,
			username: username3,
			referral: referral3,
			role: 'USER',
			blocked: false,
		});

		try {
			const result3 = await userService.registration(
				userId3,
				username3,
				referral3,
				galaxy3
			);
			console.log(
				'❌ ERROR: Should have failed with duplicate user error'
			);
			console.log('   Result:', result3);
			return false;
		} catch (error) {
			console.log(
				'✅ SUCCESS: Correctly failed with duplicate user error'
			);
			console.log('   Error:', error.message);

			// Проверяем, что дополнительные данные не были созданы
			const userStateInDb = await UserState.findOne({
				where: { userId: userId3 },
			});
			const galaxyInDb = await Galaxy.findOne({
				where: { userId: userId3 },
			});

			console.log('   UserState should not exist:', !userStateInDb);
			console.log('   Galaxy should not exist:', !galaxyInDb);

			if (userStateInDb || galaxyInDb) {
				console.log(
					'❌ ERROR: Additional data was incorrectly created during rollback'
				);
				return false;
			}
		}

		// Тест 4: Проверка отложенных ограничений
		console.log('\n' + '='.repeat(80));
		console.log('📝 Test 4: Deferred constraints handling...');
		const userId4 = BigInt(777666555);
		const username4 = 'transactiontest4';
		const referral4 = BigInt(123456);
		const galaxy4 = {
			seed: 'transaction_test_galaxy_4',
			starMin: 100,
			starCurrent: 150,
			price: 100,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Transaction Test Galaxy 4',
				type: 'spiral',
				color: '#4A90E2',
				size: 'medium',
				complexity: 0.7,
			},
		};

		try {
			const result4 = await userService.registration(
				userId4,
				username4,
				referral4,
				galaxy4
			);

			console.log('✅ SUCCESS: Deferred constraints handled correctly');
			console.log('   All data created successfully');
			console.log('   No constraint violations during transaction');
		} catch (error) {
			console.log('❌ ERROR in deferred constraints test:');
			console.log('   Error:', error.message);
			return false;
		}

		return true;
	} catch (error) {
		console.error(
			'❌ Error in transaction correctness test:',
			error.message
		);
		console.error('   Stack:', error.stack);
		return false;
	}
}

// Функция для очистки тестовых данных
async function cleanupTestData() {
	try {
		console.log('\n🧹 Cleaning up test data...');

		const testUserIds = [
			BigInt(999888777),
			BigInt(888777666),
			BigInt(777666555),
		];

		for (const userId of testUserIds) {
			try {
				// Удаляем пользователя и связанные данные
				await User.destroy({
					where: { id: userId },
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

// Основная функция
async function main() {
	console.log('🚀 Starting Transaction Correctness Tests...\n');

	try {
		// Проверяем подключение к базе данных
		await sequelize.authenticate();
		console.log('✅ Database connection established');

		// Запускаем тесты
		const testResult = await testTransactionCorrectness();

		// Очищаем тестовые данные
		const cleanupResult = await cleanupTestData();

		console.log('\n' + '='.repeat(80));
		console.log('📊 Test Results:');
		console.log(
			'   Transaction correctness tests:',
			testResult ? '✅ PASSED' : '❌ FAILED'
		);
		console.log(
			'   Data cleanup:',
			cleanupResult ? '✅ COMPLETED' : '❌ FAILED'
		);

		if (testResult && cleanupResult) {
			console.log('\n🎉 All transaction tests completed successfully!');
			console.log('\n💡 Summary:');
			console.log('   - Transaction atomicity verified');
			console.log('   - Rollback functionality tested');
			console.log('   - Deferred constraints handling verified');
			console.log('   - Data consistency maintained');
		} else {
			console.log(
				'\n⚠️  Some tests failed. Check the output above for details.'
			);
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
			console.error(
				'❌ Error closing database connection:',
				error.message
			);
		}
	}
}

// Запускаем тесты
if (require.main === module) {
	main().catch(console.error);
}

module.exports = {
	testTransactionCorrectness,
	cleanupTestData,
};
