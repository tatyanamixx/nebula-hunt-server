/**
 * Финальный тест регистрации пользователя
 */
const sequelize = require('./db');
const userService = require('./service/user-service');

async function finalTest() {
	try {
		console.log('🎉 Финальный тест регистрации пользователя...');

		const userId = 111111
		const username = 'finaltestuser';
		const referral = BigInt(0);

		// Данные для галактики
		const galaxies = [
			{
				seed: 'final_test_galaxy',
				starMin: 100,
				starCurrent: 150,
				price: 200,
				particleCount: 120,
				galaxyProperties: {
					type: 'spiral',
					color: 'blue',
					size: 'medium',
				},
			},
		];

		console.log('📝 Данные для регистрации:', {
			userId: userId,
			username: username,
			galaxiesCount: galaxies.length,
		});

		// Регистрируем пользователя
		const result = await userService.registration(
			userId,
			username,
			referral,
			null, // reqUserState
			galaxies
		);

		console.log('✅ Пользователь зарегистрирован успешно!');
		console.log('👤 Пользователь:', {
			id: result.user.id,
			username: result.user.username,
			role: result.user.role,
		});

		console.log('🌌 Галактики:', result.userGalaxies.length);
		if (result.userGalaxies.length > 0) {
			console.log('   - ID галактики:', result.userGalaxies[0].galaxy.id);
			console.log(
				'   - Seed галактики:',
				result.userGalaxies[0].galaxy.seed
			);
		}

		console.log('🔑 Токены:', {
			hasAccessToken: !!result.accessToken,
			hasRefreshToken: !!result.refreshToken,
		});

		await sequelize.close();
		console.log(
			'🎯 Тест завершен успешно! Проблема с DEFERRABLE INITIALLY DEFERRED решена!'
		);
	} catch (error) {
		console.error('❌ Ошибка в финальном тесте:', error);
		await sequelize.close();
	}
}

finalTest();
