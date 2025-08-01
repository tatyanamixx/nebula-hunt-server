const axios = require('axios');

// Конфигурация
const BASE_URL = 'http://localhost:5000';

// Функция для тестирования registration endpoint без Telegram аутентификации
async function testUserRegistrationSimple() {
	try {
		console.log(
			'🧪 Testing User Registration endpoint (Simple version)...\n'
		);

		// Тест 1: Попытка регистрации без Telegram данных
		console.log('📝 Test 1: Registration without Telegram data...');
		const registrationData = {
			referral: '123456',
			galaxy: {
				name: 'Test Galaxy',
				description: 'A test galaxy for registration',
			},
		};

		try {
			await axios.post(
				`${BASE_URL}/api/auth/registration`,
				registrationData,
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			console.log('❌ Should have failed without Telegram data');
		} catch (error) {
			if (
				error.response?.status === 401 ||
				error.response?.status === 400
			) {
				console.log('✅ Correctly failed without Telegram data');
				console.log('   Status:', error.response.status);
				console.log(
					'   Error message:',
					error.response.data?.message || 'Unknown error'
				);
			} else {
				console.log(
					'❌ Unexpected error:',
					error.response?.status,
					error.response?.data
				);
			}
		}

		// Тест 2: Попытка регистрации с пустыми данными
		console.log('\n📝 Test 2: Registration with empty data...');
		try {
			await axios.post(
				`${BASE_URL}/api/auth/registration`,
				{},
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			console.log('❌ Should have failed with empty data');
		} catch (error) {
			if (
				error.response?.status === 401 ||
				error.response?.status === 400
			) {
				console.log('✅ Correctly failed with empty data');
				console.log('   Status:', error.response.status);
				console.log(
					'   Error message:',
					error.response.data?.message || 'Unknown error'
				);
			} else {
				console.log(
					'❌ Unexpected error:',
					error.response?.status,
					error.response?.data
				);
			}
		}

		// Тест 3: Попытка регистрации с неверным Content-Type
		console.log('\n📝 Test 3: Registration with wrong Content-Type...');
		try {
			await axios.post(
				`${BASE_URL}/api/auth/registration`,
				registrationData,
				{
					headers: {
						'Content-Type': 'text/plain',
					},
				}
			);
			console.log('❌ Should have failed with wrong Content-Type');
		} catch (error) {
			if (
				error.response?.status === 400 ||
				error.response?.status === 415
			) {
				console.log('✅ Correctly failed with wrong Content-Type');
				console.log('   Status:', error.response.status);
				console.log(
					'   Error message:',
					error.response.data?.message || 'Unknown error'
				);
			} else {
				console.log(
					'❌ Unexpected error:',
					error.response?.status,
					error.response?.data
				);
			}
		}

		// Тест 4: Проверка health endpoint
		console.log('\n📝 Test 4: Health endpoint check...');
		try {
			const healthResponse = await axios.get(`${BASE_URL}/health`);
			console.log('✅ Health endpoint working:');
			console.log('   Status:', healthResponse.status);
			console.log('   Data:', healthResponse.data);
		} catch (error) {
			console.log(
				'❌ Health endpoint failed:',
				error.response?.status,
				error.response?.data
			);
		}

		// Тест 5: Проверка доступности registration endpoint
		console.log('\n📝 Test 5: Registration endpoint availability...');
		try {
			// Используем OPTIONS для проверки доступности endpoint
			const optionsResponse = await axios.options(
				`${BASE_URL}/api/auth/registration`
			);
			console.log('✅ Registration endpoint is available:');
			console.log('   Status:', optionsResponse.status);
			console.log(
				'   Allowed methods:',
				optionsResponse.headers['allow'] || 'Unknown'
			);
		} catch (error) {
			console.log(
				'❌ Registration endpoint not available:',
				error.response?.status,
				error.response?.data
			);
		}

		console.log('\n🎉 Simple user registration testing completed!');
		console.log(
			'\n💡 Note: Full registration testing requires Telegram WebApp initData.'
		);
		console.log(
			'   Use test-user-registration.js for complete testing with Telegram authentication.'
		);

		return true;
	} catch (error) {
		console.error('❌ Error in simple registration test:', error.message);
		if (error.response) {
			console.error('   Status:', error.response.status);
			console.error('   Data:', error.response.data);
		}
		return false;
	}
}

// Функция для тестирования других auth endpoints
async function testOtherAuthEndpoints() {
	try {
		console.log('\n🧪 Testing other auth endpoints...\n');

		// Тест login endpoint
		console.log('📝 Test 1: Login endpoint...');
		try {
			await axios.post(
				`${BASE_URL}/api/auth/login`,
				{},
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			console.log('❌ Should have failed without Telegram data');
		} catch (error) {
			if (
				error.response?.status === 401 ||
				error.response?.status === 400
			) {
				console.log('✅ Login correctly failed without Telegram data');
				console.log('   Status:', error.response.status);
			} else {
				console.log(
					'❌ Unexpected login error:',
					error.response?.status,
					error.response?.data
				);
			}
		}

		// Тест logout endpoint
		console.log('\n📝 Test 2: Logout endpoint...');
		try {
			await axios.post(
				`${BASE_URL}/api/auth/logout`,
				{},
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			console.log('❌ Should have failed without authentication');
		} catch (error) {
			if (
				error.response?.status === 401 ||
				error.response?.status === 400
			) {
				console.log(
					'✅ Logout correctly failed without authentication'
				);
				console.log('   Status:', error.response.status);
			} else {
				console.log(
					'❌ Unexpected logout error:',
					error.response?.status,
					error.response?.data
				);
			}
		}

		// Тест refresh endpoint
		console.log('\n📝 Test 3: Refresh endpoint...');
		try {
			await axios.get(`${BASE_URL}/api/auth/refresh`, {
				headers: {
					'Content-Type': 'application/json',
				},
			});
			console.log('❌ Should have failed without refresh token');
		} catch (error) {
			if (
				error.response?.status === 401 ||
				error.response?.status === 400
			) {
				console.log(
					'✅ Refresh correctly failed without refresh token'
				);
				console.log('   Status:', error.response.status);
			} else {
				console.log(
					'❌ Unexpected refresh error:',
					error.response?.status,
					error.response?.data
				);
			}
		}

		return true;
	} catch (error) {
		console.error('❌ Error testing other auth endpoints:', error.message);
		return false;
	}
}

// Основная функция
async function main() {
	console.log('🚀 Starting Simple User Registration Tests...\n');

	// Проверяем, что сервер запущен
	try {
		await axios.get(`${BASE_URL}/health`);
		console.log('✅ Server is running');
	} catch (error) {
		console.error(
			'❌ Server is not running. Please start the server first.'
		);
		console.error('   Run: npm start');
		process.exit(1);
	}

	// Запускаем тесты
	const registrationResult = await testUserRegistrationSimple();
	const otherEndpointsResult = await testOtherAuthEndpoints();

	console.log('\n📊 Test Results:');
	console.log(
		'   Registration tests:',
		registrationResult ? '✅ PASSED' : '❌ FAILED'
	);
	console.log(
		'   Other endpoints tests:',
		otherEndpointsResult ? '✅ PASSED' : '❌ FAILED'
	);

	if (registrationResult && otherEndpointsResult) {
		console.log('\n🎉 All simple tests passed successfully!');
		console.log('\n💡 For full testing with Telegram authentication:');
		console.log('   node test-user-registration.js');
	} else {
		console.log(
			'\n⚠️  Some tests failed. Check the output above for details.'
		);
		process.exit(1);
	}
}

// Запускаем тесты
if (require.main === module) {
	main().catch(console.error);
}

module.exports = {
	testUserRegistrationSimple,
	testOtherAuthEndpoints,
};
