/**
 * Тест универсального метода login
 */
const userService = require('./service/user-service');

async function testUniversalLogin() {
	console.log('Testing universal login method...\n');

	try {
		// Тест 1: Попытка логина существующего пользователя (без userData)
		console.log('Test 1: Login existing user (without userData)');
		try {
			const result1 = await userService.login(12345);
			console.log('✅ Existing user login successful');
			console.log('User ID:', result1.user.id);
			console.log(
				'Has tokens:',
				!!result1.accessToken && !!result1.refreshToken
			);
			console.log('Has userState:', !!result1.userState);
			console.log('Has galaxies:', !!result1.galaxies);
			console.log('Has artifacts:', !!result1.artifacts);
			console.log('Has data:', !!result1.data);
		} catch (error) {
			console.log('❌ Existing user login failed:', error.message);
		}

		console.log('\n' + '='.repeat(50) + '\n');

		// Тест 2: Попытка регистрации нового пользователя (с userData)
		console.log('Test 2: Register new user (with userData)');
		try {
			const userData = {
				username: 'test_user_' + Date.now(),
				referral: 0,
			};

			const galaxyData = {
				starMin: 100,
				starCurrent: 100,
				price: 100,
				seed: 'test123',
				particleCount: 100,
				onParticleCountChange: true,
				galaxyProperties: {
					type: 'spiral',
					colorPalette: {
						insideColor: '#ff1493',
						outsideColor: '#00ffff',
						coreColor: '#ffd700',
						armColor: '#ff4500',
					},
					branches: 5,
					radius: 4.2,
					randomness: 0.5,
					randomnessPower: 2.3,
					armWidth: 0.25,
					tilt: 0.4,
					warp: 0.1,
					rotation: 1.57,
					scale: 0.5,
					coreRadius: 0.3,
					coreDensity: 0.001,
				},
			};

			const newUserId = Date.now(); // Используем timestamp как ID
			const result2 = await userService.login(
				newUserId,
				userData,
				galaxyData
			);
			console.log('✅ New user registration successful');
			console.log('User ID:', result2.user.id);
			console.log('Username:', result2.user.username);
			console.log(
				'Has tokens:',
				!!result2.accessToken && !!result2.refreshToken
			);
			console.log('Has userState:', !!result2.userState);
			console.log('Has galaxy:', !!result2.galaxy);
			console.log('Has data:', !!result2.data);
		} catch (error) {
			console.log('❌ New user registration failed:', error.message);
		}

		console.log('\n' + '='.repeat(50) + '\n');

		// Тест 3: Попытка логина несуществующего пользователя (без userData)
		console.log('Test 3: Login non-existent user (without userData)');
		try {
			const result3 = await userService.login(999999999);
			console.log('❌ Unexpected success for non-existent user');
		} catch (error) {
			console.log(
				'✅ Correctly failed for non-existent user:',
				error.message
			);
		}
	} catch (error) {
		console.error('Test failed:', error);
	}
}

// Запускаем тест
testUniversalLogin()
	.then(() => {
		console.log('\nTest completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Test error:', error);
		process.exit(1);
	});
