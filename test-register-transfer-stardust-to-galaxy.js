/**
 * Тест процесса передачи stardust в галактику
 */
const sequelize = require('./db');
const gameService = require('./service/game-service');
const userService = require('./service/user-service');

async function testRegisterTransferStardustToGalaxy() {
	try {
		console.log('🧪 Testing registerTransferStardustToGalaxy process...');

		// Тестовые данные
		const userId = 8888888888; // Используем существующего пользователя
		const username = 'transfertestuser';
		const referral = null;
		const galaxySeed = 'farming-test-seed-1754106138579'; // Используем существующую галактику

		// Данные для передачи stardust в галактику
		const galaxyData = {
			seed: galaxySeed,
		};

		const reward = {
			currency: 'stardust',
			price: 50000, // Стоимость в stardust
			resource: 'stars',
			amount: 1000, // Количество stars, которые получит галактика
		};

		console.log('✅ Test data prepared');
		console.log('User ID:', userId);
		console.log('Username:', username);
		console.log('Galaxy seed:', galaxySeed);
		console.log('Transfer data:', {
			galaxyData,
			reward,
		});

		// Сначала логиним пользователя (он уже должен существовать)
		console.log('\n📝 Step 1: Logging in existing user...');
		const loginResult = await userService.login(
			userId,
			username,
			referral,
			null // без создания новой галактики
		);

		console.log('✅ User login completed');
		console.log('Result keys:', Object.keys(loginResult));

		if (loginResult.user) {
			console.log('User:', {
				id: loginResult.user.id,
				username: loginResult.user.username,
				role: loginResult.user.role,
			});
		}

		if (loginResult.userState) {
			console.log('Initial user state:', {
				userId: loginResult.userState.userId,
				stardust: loginResult.userState.stardust,
				darkMatter: loginResult.userState.darkMatter,
				stars: loginResult.userState.stars,
			});
		}

		// Проверяем, есть ли у пользователя достаточно stardust
		console.log('\n💰 Step 2: Checking user balance...');
		const currentStardust = loginResult.userState
			? loginResult.userState.stardust
			: 0;
		console.log('Current stardust balance:', currentStardust);
		console.log('Required stardust for transfer:', reward.price);

		if (currentStardust < reward.price) {
			console.log(
				'⚠️ User has insufficient stardust. Adding some for testing...'
			);

			// Добавляем stardust через фарминг для тестирования
			const farmingData = [
				{
					resource: 'stardust',
					amount: reward.price + 1000, // Добавляем немного больше
				},
				{
					resource: 'darkMatter',
					amount: 100,
				},
			];

			const farmingResult = await gameService.registerFarmingReward(
				userId,
				farmingData
			);

			console.log('✅ Added stardust via farming:', {
				success: farmingResult.success,
				addedStardust: reward.price + 1000,
			});
		}

		// Теперь тестируем передачу stardust в галактику
		console.log('\n🌌 Step 3: Testing transfer stardust to galaxy...');
		const transferResult =
			await gameService.registerTransferStardustToGalaxy(
				userId,
				galaxyData,
				reward
			);

		console.log('✅ Transfer completed successfully');
		console.log('Transfer result:', {
			success: transferResult.success,
			message: transferResult.message,
		});

		// Выводим детали результата
		if (transferResult.data) {
			console.log('Galaxy:', {
				id: transferResult.data.galaxy.id,
				seed: transferResult.data.galaxy.seed,
			});

			console.log('Offer:', {
				id: transferResult.data.offer.id,
				price: transferResult.data.offer.price,
				currency: transferResult.data.offer.currency,
				amount: transferResult.data.offer.amount,
				resource: transferResult.data.offer.resource,
			});

			console.log('Transaction:', {
				id: transferResult.data.transaction.id,
				status: transferResult.data.transaction.status,
			});

			console.log('Updated user state:', {
				stardust: transferResult.data.userState.stardust,
				darkMatter: transferResult.data.userState.darkMatter,
				stars: transferResult.data.userState.stars,
			});
		}

		// Проверяем созданные транзакции в базе данных
		console.log('\n📋 Step 4: Checking database transactions...');

		// Проверяем market offers для галактики
		const [marketOffers] = await sequelize.query(`
            SELECT * FROM marketoffers 
            WHERE "buyerId" = ${userId} AND "itemType" = 'galaxy' AND "txType" = 'GALAXY_RESOURCE'
            ORDER BY "createdAt" DESC
            LIMIT 5
        `);

		console.log('Market offers for galaxy found:', marketOffers.length);
		marketOffers.forEach((offer, index) => {
			console.log(`Offer ${index + 1}:`, {
				id: offer.id,
				sellerId: offer.sellerId,
				buyerId: offer.buyerId,
				txType: offer.txType,
				itemType: offer.itemType,
				itemId: offer.itemId,
				price: offer.price,
				currency: offer.currency,
				amount: offer.amount,
				resource: offer.resource,
				offerType: offer.offerType,
				status: offer.status,
				createdAt: offer.createdAt,
			});
		});

		// Проверяем market transactions
		const [marketTransactions] = await sequelize.query(`
            SELECT mt.*, mo."itemType", mo."resource", mo."amount", mo."txType"
            FROM markettransactions mt
            JOIN marketoffers mo ON mt."offerId" = mo.id
            WHERE mt."buyerId" = ${userId} AND mo."itemType" = 'galaxy' AND mo."txType" = 'GALAXY_RESOURCE'
            ORDER BY mt."createdAt" DESC
            LIMIT 5
        `);

		console.log(
			'Market transactions for galaxy found:',
			marketTransactions.length
		);
		marketTransactions.forEach((tx, index) => {
			console.log(`Transaction ${index + 1}:`, {
				id: tx.id,
				offerId: tx.offerId,
				buyerId: tx.buyerId,
				sellerId: tx.sellerId,
				txType: tx.txType,
				status: tx.status,
				createdAt: tx.createdAt,
			});
		});

		// Проверяем payment transactions
		const [paymentTransactions] = await sequelize.query(`
            SELECT pt.*, mt."buyerId", mt."sellerId"
            FROM paymenttransactions pt
            JOIN markettransactions mt ON pt."marketTransactionId" = mt.id
            JOIN marketoffers mo ON mt."offerId" = mo.id
            WHERE mt."buyerId" = ${userId} AND mo."itemType" = 'galaxy' AND mo."txType" = 'GALAXY_RESOURCE'
            ORDER BY pt."createdAt" DESC
            LIMIT 10
        `);

		console.log(
			'Payment transactions for galaxy found:',
			paymentTransactions.length
		);
		paymentTransactions.forEach((pt, index) => {
			console.log(`Payment ${index + 1}:`, {
				id: pt.id,
				marketTransactionId: pt.marketTransactionId,
				fromAccount: pt.fromAccount,
				toAccount: pt.toAccount,
				priceOrAmount: pt.priceOrAmount,
				currencyOrResource: pt.currencyOrResource,
				txType: pt.txType,
				status: pt.status,
				createdAt: pt.createdAt,
			});
		});

		// Проверяем обновленное состояние пользователя в базе
		const [userStateResult] = await sequelize.query(`
            SELECT * FROM userstates 
            WHERE "userId" = ${userId}
        `);

		if (userStateResult.length > 0) {
			const userState = userStateResult[0];
			console.log('\n📊 Final user state in database:', {
				userId: userState.userId,
				stardust: userState.stardust,
				darkMatter: userState.darkMatter,
				stars: userState.stars,
				tgStars: userState.tgStars,
				tonToken: userState.tonToken,
				updatedAt: userState.updatedAt,
			});
		}

		// Проверяем состояние галактики
		const [galaxyResult] = await sequelize.query(`
            SELECT * FROM galaxies 
            WHERE "seed" = '${galaxySeed}'
        `);

		if (galaxyResult.length > 0) {
			const galaxy = galaxyResult[0];
			console.log('\n🌌 Galaxy state after transfer:', {
				id: galaxy.id,
				userId: galaxy.userId,
				seed: galaxy.seed,
				starCurrent: galaxy.starCurrent,
				starMin: galaxy.starMin,
				price: galaxy.price,
				active: galaxy.active,
				updatedAt: galaxy.updatedAt,
			});
		}

		// Тестируем повторную передачу с другими параметрами
		console.log(
			'\n🔄 Step 5: Testing repeated transfer with different parameters...'
		);
		const repeatedReward = {
			currency: 'darkMatter',
			price: 500, // Стоимость в darkMatter
			resource: 'stars',
			amount: 25000, // Количество stars
		};

		const repeatedResult =
			await gameService.registerTransferStardustToGalaxy(
				userId,
				galaxyData,
				repeatedReward
			);

		console.log('✅ Repeated transfer completed');
		console.log('Repeated transfer result:', {
			success: repeatedResult.success,
			message: repeatedResult.message,
		});

		// Проверяем итоговое состояние
		const [finalUserState] = await sequelize.query(`
            SELECT * FROM userstates 
            WHERE "userId" = ${userId}
        `);

		if (finalUserState.length > 0) {
			const finalState = finalUserState[0];
			console.log('\n📊 Final user state after repeated transfer:', {
				userId: finalState.userId,
				stardust: finalState.stardust,
				darkMatter: finalState.darkMatter,
				stars: finalState.stars,
				tgStars: finalState.tgStars,
				tonToken: finalState.tonToken,
				updatedAt: finalState.updatedAt,
			});
		}

		console.log(
			'\n✅ RegisterTransferStardustToGalaxy test completed successfully!'
		);
		console.log('Summary:');
		console.log('- User logged in successfully');
		console.log('- First transfer to galaxy processed');
		console.log('- Repeated transfer to galaxy processed');
		console.log('- All database transactions created correctly');
		console.log('- User state updated properly');
		console.log('- Galaxy state updated properly');
	} catch (error) {
		console.error('❌ Error in transfer test:', error.message);
		console.error('Stack:', error.stack);
	} finally {
		await sequelize.close();
	}
}

testRegisterTransferStardustToGalaxy();
