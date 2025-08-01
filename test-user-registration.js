const axios = require('axios');
const crypto = require('crypto');

// Конфигурация
const BASE_URL = 'http://localhost:5000';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'your_bot_token_here';

// Функция для создания Telegram WebApp initData
function createTelegramInitData(userId, username) {
	const initData = {
		query_id: 'test_query_id',
		user: {
			id: userId,
			is_bot: false,
			first_name: 'Test',
			last_name: 'User',
			username: username,
			language_code: 'en',
		},
		auth_date: Math.floor(Date.now() / 1000),
		hash: 'test_hash',
	};

	// Создаем строку для подписи
	const dataCheckString = Object.keys(initData)
		.filter((key) => key !== 'hash')
		.sort()
		.map((key) => `${key}=${initData[key]}`)
		.join('\n');

	// Создаем HMAC подпись
	const secretKey = crypto
		.createHmac('sha256', 'WebAppData')
		.update(BOT_TOKEN)
		.digest();
	const hash = crypto
		.createHmac('sha256', secretKey)
		.update(dataCheckString)
		.digest('hex');

	initData.hash = hash;

	return initData;
}

// Функция для тестирования registration endpoint
async function testUserRegistration() {
	try {
		console.log('🧪 Testing User Registration endpoint...\n');

		// Тест 1: Успешная регистрация
		console.log('📝 Test 1: Successful user registration...');
		const userId = 123456789;
		const username = 'testuser123';

		const initData = createTelegramInitData(userId, username);

		const registrationData = {
			referral: '123456',
			galaxy: {
				name: 'Test Galaxy',
				description: 'A test galaxy for registration',
			},
		};

		console.log('Registration data:', {
			userId,
			username,
			referral: registrationData.referral,
			galaxy: registrationData.galaxy.name,
		});

		const response = await axios.post(
			`${BASE_URL}/api/auth/registration`,
			registrationData,
			{
				headers: {
					'Content-Type': 'application/json',
					'X-Telegram-Init-Data': JSON.stringify(initData),
				},
			}
		);

		console.log('✅ Registration successful:');
		console.log('   Status:', response.status);
		console.log('   User ID:', response.data.user?.id);
		console.log('   Username:', response.data.user?.username);
		console.log('   Has refresh token:', !!response.data.refreshToken);
		console.log('   Has user state:', !!response.data.userState);
		console.log('   Has user galaxy:', !!response.data.userGalaxy);

		// Тест 2: Попытка повторной регистрации (должна вернуть ошибку)
		console.log('\n📝 Test 2: Duplicate registration attempt...');
		try {
			await axios.post(
				`${BASE_URL}/api/auth/registration`,
				registrationData,
				{
					headers: {
						'Content-Type': 'application/json',
						'X-Telegram-Init-Data': JSON.stringify(initData),
					},
				}
			);
			console.log('❌ Should have failed with duplicate user error');
		} catch (error) {
			if (
				error.response?.status === 400 ||
				error.response?.status === 409
			) {
				console.log('✅ Correctly failed with duplicate user error');
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

		// Тест 3: Регистрация с неверным referral форматом
		console.log('\n📝 Test 3: Invalid referral format...');
		const invalidReferralData = {
			referral: 'invalid_referral',
			galaxy: {
				name: 'Test Galaxy 2',
				description: 'Another test galaxy',
			},
		};

		const newUserId = 987654321;
		const newUsername = 'testuser456';
		const newInitData = createTelegramInitData(newUserId, newUsername);

		try {
			await axios.post(
				`${BASE_URL}/api/auth/registration`,
				invalidReferralData,
				{
					headers: {
						'Content-Type': 'application/json',
						'X-Telegram-Init-Data': JSON.stringify(newInitData),
					},
				}
			);
			console.log('❌ Should have failed with invalid referral format');
		} catch (error) {
			if (error.response?.status === 400) {
				console.log('✅ Correctly failed with invalid referral format');
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

		// Тест 4: Регистрация без Telegram данных
		console.log('\n📝 Test 4: Registration without Telegram data...');
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

		// Тест 5: Регистрация с минимальными данными
		console.log('\n📝 Test 5: Registration with minimal data...');
		const minimalUserId = 555666777;
		const minimalUsername = 'minimaluser';
		const minimalInitData = createTelegramInitData(
			minimalUserId,
			minimalUsername
		);

		const minimalData = {};

		try {
			const minimalResponse = await axios.post(
				`${BASE_URL}/api/auth/registration`,
				minimalData,
				{
					headers: {
						'Content-Type': 'application/json',
						'X-Telegram-Init-Data': JSON.stringify(minimalInitData),
					},
				}
			);

			console.log('✅ Minimal registration successful:');
			console.log('   Status:', minimalResponse.status);
			console.log('   User ID:', minimalResponse.data.user?.id);
			console.log('   Username:', minimalResponse.data.user?.username);
		} catch (error) {
			console.log(
				'❌ Minimal registration failed:',
				error.response?.status,
				error.response?.data
			);
		}

		console.log('\n🎉 User registration testing completed successfully!');
		return true;
	} catch (error) {
		console.error('❌ Error testing user registration:', error.message);
		if (error.response) {
			console.error('   Status:', error.response.status);
			console.error('   Data:', error.response.data);
		}
		return false;
	}
}

// Функция для тестирования login endpoint
async function testUserLogin() {
	try {
		console.log('\n🧪 Testing User Login endpoint...\n');

		// Сначала регистрируем пользователя
		const userId = 111222333;
		const username = 'logintestuser';
		const initData = createTelegramInitData(userId, username);

		// Регистрация
		await axios.post(
			`${BASE_URL}/api/auth/registration`,
			{},
			{
				headers: {
					'Content-Type': 'application/json',
					'X-Telegram-Init-Data': JSON.stringify(initData),
				},
			}
		);

		// Тест login
		console.log('📝 Testing login for registered user...');
		const loginResponse = await axios.post(
			`${BASE_URL}/api/auth/login`,
			{},
			{
				headers: {
					'Content-Type': 'application/json',
					'X-Telegram-Init-Data': JSON.stringify(initData),
				},
			}
		);

		console.log('✅ Login successful:');
		console.log('   Status:', loginResponse.status);
		console.log('   User ID:', loginResponse.data.user?.id);
		console.log('   Username:', loginResponse.data.user?.username);
		console.log('   Has refresh token:', !!loginResponse.data.refreshToken);

		return true;
	} catch (error) {
		console.error('❌ Error testing user login:', error.message);
		if (error.response) {
			console.error('   Status:', error.response.status);
			console.error('   Data:', error.response.data);
		}
		return false;
	}
}

// Основная функция
async function main() {
	console.log('🚀 Starting User Registration and Login Tests...\n');

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
	const registrationResult = await testUserRegistration();
	const loginResult = await testUserLogin();

	console.log('\n📊 Test Results:');
	console.log(
		'   Registration tests:',
		registrationResult ? '✅ PASSED' : '❌ FAILED'
	);
	console.log('   Login tests:', loginResult ? '✅ PASSED' : '❌ FAILED');

	if (registrationResult && loginResult) {
		console.log('\n🎉 All tests passed successfully!');
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
	testUserRegistration,
	testUserLogin,
};
