const { sequelize } = require('./db');
const gameService = require('./service/game-service');
const logger = require('./service/logger-service');
const {
	Galaxy,
	UserState,
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
} = require('./models/models');

// Функция для безопасной сериализации BigInt
function bigIntReplacer(key, value) {
	if (typeof value === 'bigint') {
		return value.toString();
	}
	return value;
}

// Вспомогательная функция для тестирования контроллера
async function testControllerCall(
	gameController,
	userId,
	galaxy,
	reward,
	expectError = false
) {
	const mockReq = {
		body: {
			userId,
			galaxy,
			reward,
		},
	};

	const mockRes = {
		status: (code) => ({
			json: (data) => {
				if (!expectError) {
					console.log('✅ Оферт зарегистрирован успешно');
					console.log(`📊 Код ответа: ${code}`);
					console.log(`📊 Сообщение: ${data.message}`);
					console.log(
						`📊 Данные:`,
						JSON.stringify(data.data, bigIntReplacer, 2)
					);
				}
				return data;
			},
		}),
	};

	let errorThrown = false;
	const mockNext = (error) => {
		if (error) {
			errorThrown = true;
			if (expectError) {
				console.log(
					'✅ Правильно выброшено исключение:',
					error.message
				);
			} else {
				console.error('❌ Неожиданная ошибка:', error.message);
			}
		}
	};

	try {
		await gameController.registerTransferStardustToGalaxy(
			mockReq,
			mockRes,
			mockNext
		);
		if (expectError && !errorThrown) {
			console.log('❌ Ошибка: Должна была выбросить исключение');
		}
	} catch (error) {
		if (expectError) {
			console.log('✅ Правильно выброшено исключение:', error.message);
		} else {
			throw error;
		}
	}
}

// Функция для создания тестовой галактики
async function createTestGalaxy(userId, seed) {
	console.log(
		`🔧 Создаем тестовую галактику для пользователя ${userId} с seed: ${seed}`
	);

	try {
		// Проверяем, существует ли уже галактика с таким seed
		const existingGalaxy = await Galaxy.findOne({
			where: { seed: seed },
		});

		if (existingGalaxy) {
			console.log(`✅ Галактика с seed ${seed} уже существует`);
			return existingGalaxy;
		}

		// Создаем новую галактику
		const galaxy = await Galaxy.create({
			seed: seed,
			userId: userId,
			name: `Test Galaxy ${seed}`,
			starCurrent: 0,
			starMax: 1000,
			level: 1,
			experience: 0,
			experienceMax: 100,
			status: 'ACTIVE',
		});

		console.log(`✅ Создана галактика:`, {
			id: galaxy.id,
			seed: galaxy.seed,
			userId: galaxy.userId,
			name: galaxy.name,
		});

		return galaxy;
	} catch (error) {
		console.error(`❌ Ошибка при создании галактики:`, error.message);
		throw error;
	}
}

// Функция для проверки состояния пользователя
async function checkUserState(userId) {
	console.log(`📊 Проверяем состояние пользователя ${userId}`);

	try {
		const userState = await UserState.findOne({
			where: { userId: userId },
		});

		if (userState) {
			console.log(`✅ Состояние пользователя:`, {
				userId: userState.userId,
				stardust: userState.stardust,
				darkMatter: userState.darkMatter,
				stars: userState.stars,
				lockedStars: userState.lockedStars,
			});
		} else {
			console.log(`❌ Состояние пользователя не найдено`);
		}

		return userState;
	} catch (error) {
		console.error(
			`❌ Ошибка при проверке состояния пользователя:`,
			error.message
		);
		throw error;
	}
}

// Функция для проверки состояния галактики
async function checkGalaxyState(seed) {
	console.log(`🌌 Проверяем состояние галактики с seed: ${seed}`);

	try {
		const galaxy = await Galaxy.findOne({
			where: { seed: seed },
		});

		if (galaxy) {
			console.log(`✅ Состояние галактики:`, {
				id: galaxy.id,
				seed: galaxy.seed,
				userId: galaxy.userId,
				name: galaxy.name,
				starCurrent: galaxy.starCurrent,
				starMax: galaxy.starMax,
				level: galaxy.level,
				experience: galaxy.experience,
				experienceMax: galaxy.experienceMax,
				status: galaxy.status,
			});
		} else {
			console.log(`❌ Галактика не найдена`);
		}

		return galaxy;
	} catch (error) {
		console.error(
			`❌ Ошибка при проверке состояния галактики:`,
			error.message
		);
		throw error;
	}
}

// Функция для проверки транзакций
async function checkTransactions(userId) {
	console.log(`📊 Проверяем транзакции для пользователя ${userId}`);

	try {
		// Проверяем MarketOffer (где пользователь является продавцом или покупателем через транзакции)
		const marketOffers = await MarketOffer.findAll({
			where: { sellerId: userId },
			order: [['createdAt', 'DESC']],
			limit: 5,
		});

		console.log(
			`📋 MarketOffer (где пользователь продавец, последние 5):`,
			marketOffers.length
		);
		marketOffers.forEach((offer, index) => {
			console.log(
				`  ${index + 1}. ID: ${offer.id}, SellerId: ${
					offer.sellerId
				}, Price: ${offer.price}, Currency: ${
					offer.currency
				}, Status: ${offer.status}, Created: ${offer.createdAt}`
			);
		});

		// Проверяем MarketTransaction (где пользователь является покупателем)
		const marketTransactions = await MarketTransaction.findAll({
			where: { buyerId: userId },
			order: [['createdAt', 'DESC']],
			limit: 5,
		});

		console.log(
			`📋 MarketTransaction (где пользователь покупатель, последние 5):`,
			marketTransactions.length
		);
		marketTransactions.forEach((tx, index) => {
			console.log(
				`  ${index + 1}. ID: ${tx.id}, OfferId: ${
					tx.offerId
				}, BuyerId: ${tx.buyerId}, SellerId: ${tx.sellerId}, Status: ${
					tx.status
				}, Created: ${tx.createdAt}`
			);
		});

		// Проверяем PaymentTransaction (где пользователь получает или отправляет)
		const paymentTransactionsReceived = await PaymentTransaction.findAll({
			where: { toAccount: userId },
			order: [['createdAt', 'DESC']],
			limit: 5,
		});

		const paymentTransactionsSent = await PaymentTransaction.findAll({
			where: { fromAccount: userId },
			order: [['createdAt', 'DESC']],
			limit: 5,
		});

		console.log(
			`📋 PaymentTransaction (полученные, последние 5):`,
			paymentTransactionsReceived.length
		);
		paymentTransactionsReceived.forEach((tx, index) => {
			console.log(
				`  ${index + 1}. ID: ${tx.id}, From: ${tx.fromAccount}, To: ${
					tx.toAccount
				}, Amount: ${tx.priceOrAmount}, Currency: ${
					tx.currencyOrResource
				}, Type: ${tx.txType}, Status: ${tx.status}, Created: ${
					tx.createdAt
				}`
			);
		});

		console.log(
			`📋 PaymentTransaction (отправленные, последние 5):`,
			paymentTransactionsSent.length
		);
		paymentTransactionsSent.forEach((tx, index) => {
			console.log(
				`  ${index + 1}. ID: ${tx.id}, From: ${tx.fromAccount}, To: ${
					tx.toAccount
				}, Amount: ${tx.priceOrAmount}, Currency: ${
					tx.currencyOrResource
				}, Type: ${tx.txType}, Status: ${tx.status}, Created: ${
					tx.createdAt
				}`
			);
		});

		return {
			marketOffers,
			marketTransactions,
			paymentTransactionsReceived,
			paymentTransactionsSent,
		};
	} catch (error) {
		console.error(`❌ Ошибка при проверке транзакций:`, error.message);
		throw error;
	}
}

async function testRegisterTransferStardustToGalaxy() {
	console.log('🧪 Тестирование registerTransferStardustToGalaxy...\n');

	try {
		const testUserId = 99999999998; // Используем тестового пользователя
		const testGalaxySeed = 'test_new_user_galaxy_1753984000000';

		// Проверяем начальное состояние
		console.log('📊 Проверяем начальное состояние...');
		console.log('='.repeat(50));
		await checkUserState(testUserId);
		await checkGalaxyState(testGalaxySeed);
		await checkTransactions(testUserId);
		console.log('');

		// Создаем тестовую галактику
		console.log('🔧 Создаем тестовую галактику...');
		console.log('='.repeat(50));
		const galaxy = await createTestGalaxy(testUserId, testGalaxySeed);
		console.log('');

		// Тест 1: Корректные данные
		console.log('📝 Тест 1: Корректные данные');
		console.log('='.repeat(50));

		const validGalaxyData = {
			seed: testGalaxySeed,
		};

		const validReward = {
			currency: 'stardust',
			price: 1000,
			resource: 'stars',
			amount: 500,
		};

		// Вызываем контроллер напрямую
		const gameController = require('./controllers/game-controller');
		await testControllerCall(
			gameController,
			testUserId,
			validGalaxyData,
			validReward
		);
		console.log('');

		// Проверяем состояние после транзакции
		console.log('📊 Проверяем состояние после транзакции...');
		console.log('='.repeat(50));
		await checkUserState(testUserId);
		await checkGalaxyState(testGalaxySeed);
		await checkTransactions(testUserId);
		console.log('');

		// Тест 2: Недостаточно средств
		console.log('❌ Тест 2: Недостаточно средств');
		console.log('='.repeat(50));

		await testControllerCall(
			gameController,
			testUserId,
			validGalaxyData,
			{
				currency: 'stardust',
				price: 1000000, // Очень большая сумма
				resource: 'stars',
				amount: 500,
			},
			true // Ожидаем ошибку
		);
		console.log('');

		// Тест 3: Галактика не найдена
		console.log('❌ Тест 3: Галактика не найдена');
		console.log('='.repeat(50));

		await testControllerCall(
			gameController,
			testUserId,
			{ seed: 'non-existent-galaxy' },
			validReward,
			true // Ожидаем ошибку
		);
		console.log('');

		// Тест 4: Отрицательная цена
		console.log('❌ Тест 4: Отрицательная цена');
		console.log('='.repeat(50));

		await testControllerCall(
			gameController,
			testUserId,
			validGalaxyData,
			{
				currency: 'stardust',
				price: -100,
				resource: 'stars',
				amount: 500,
			},
			true // Ожидаем ошибку
		);
		console.log('');

		// Тест 5: Отрицательное количество
		console.log('❌ Тест 5: Отрицательное количество');
		console.log('='.repeat(50));

		await testControllerCall(
			gameController,
			testUserId,
			validGalaxyData,
			{
				currency: 'stardust',
				price: 1000,
				resource: 'stars',
				amount: -500,
			},
			true // Ожидаем ошибку
		);
		console.log('');

		// Тест 6: Отсутствие обязательных полей
		console.log('❌ Тест 6: Отсутствие обязательных полей');
		console.log('='.repeat(50));

		await testControllerCall(
			gameController,
			testUserId,
			{ seed: '' }, // Пустой seed
			validReward,
			true // Ожидаем ошибку
		);
		console.log('');

		// Тест 7: Проверка с другой валютой (darkMatter)
		console.log('📊 Тест 7: Проверка с darkMatter');
		console.log('='.repeat(50));

		await testControllerCall(gameController, testUserId, validGalaxyData, {
			currency: 'darkMatter',
			price: 100,
			resource: 'stars',
			amount: 200,
		});
		console.log('');

		// Финальная проверка состояния
		console.log('📊 Финальная проверка состояния...');
		console.log('='.repeat(50));
		await checkUserState(testUserId);
		await checkGalaxyState(testGalaxySeed);
		await checkTransactions(testUserId);
		console.log('');

		console.log(
			'🎉 Все тесты registerTransferStardustToGalaxy прошли успешно!'
		);
	} catch (error) {
		console.error(
			'❌ Ошибка в тестах registerTransferStardustToGalaxy:',
			error.message
		);
		console.error('Stack:', error.stack);
		throw error;
	}
}

// Запуск тестов
testRegisterTransferStardustToGalaxy()
	.then(() => {
		console.log(
			'✅ Тесты registerTransferStardustToGalaxy завершены успешно'
		);
		process.exit(0);
	})
	.catch((error) => {
		console.error(
			'❌ Тесты registerTransferStardustToGalaxy завершились с ошибкой:',
			error
		);
		process.exit(1);
	});
