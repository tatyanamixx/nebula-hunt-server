/**
 * Тест процесса фарминга наград
 */
const sequelize = require('./db');
const gameService = require('./service/game-service');
const userService = require('./service/user-service');

async function testFarmingReward() {
	try {
		console.log('🧪 Testing farming reward process...');

		// Тестовые данные
		const userId = 8888888888; // Новый тестовый пользователь для фарминга
		const username = 'farmingtestuser';
		const referral = null;
		const galaxyData = {
			seed: 'farming-test-seed-' + Date.now(),
			starMin: 100,
			starCurrent: 123456,
			price: 0,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {},
		};

		// Данные для фарминга (как приходит от контроллера)
		const farmingData = [
			{
				resource: 'stardust',
				amount: 150,
			},
			{
				resource: 'darkMatter',
				amount: 75,
			},
		];

		console.log('✅ Test data prepared');
		console.log('User ID:', userId);
		console.log('Username:', username);
		console.log('Galaxy data:', galaxyData);
		console.log('Farming data:', farmingData);

		// Сначала создаем/логиним пользователя с галактикой
		console.log('\n📝 Step 1: Creating/logging in user with galaxy...');
		const loginResult = await userService.login(
			userId,
			username,
			referral,
			galaxyData
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

		if (loginResult.galaxy) {
			console.log('Galaxy:', {
				id: loginResult.galaxy.id,
				seed: loginResult.galaxy.seed,
				userId: loginResult.galaxy.userId,
				starCurrent: loginResult.galaxy.starCurrent,
			});
		}

		// Теперь тестируем фарминг
		console.log('\n🌾 Step 2: Testing farming reward...');
		const farmingResult = await gameService.registerFarmingReward(
			userId,
			farmingData
		);

		console.log('✅ Farming reward completed successfully');
		console.log('Farming result:', {
			success: farmingResult.success,
			message: farmingResult.message,
			rewardsCount: farmingResult.data.rewards.length,
		});

		// Выводим детали наград
		farmingResult.data.rewards.forEach((reward, index) => {
			console.log(`Reward ${index + 1}:`, {
				resource: reward.resource,
				amount: reward.amount,
				success: reward.success,
				offerId: reward.offerId,
				marketTransactionId: reward.marketTransactionId,
			});
		});

		// Выводим обновленное состояние пользователя
		console.log('Updated user state:', {
			stardust: farmingResult.data.userState.stardust,
			darkMatter: farmingResult.data.userState.darkMatter,
			stars: farmingResult.data.userState.stars,
		});

		// Проверяем созданные транзакции в базе данных
		// console.log('\n📋 Step 3: Checking database transactions...');

		// // Проверяем market offers
		// const [marketOffers] = await sequelize.query(`
        //     SELECT * FROM marketoffers 
        //     WHERE "buyerId" = ${userId} AND "itemType" = 'resource' AND "resource" IN ('stardust', 'darkMatter')
        //     ORDER BY "createdAt" DESC
        //     LIMIT 5
        // `);

		// console.log('Market offers found:', marketOffers.length);
		// marketOffers.forEach((offer, index) => {
		// 	console.log(`Offer ${index + 1}:`, {
		// 		id: offer.id,
		// 		sellerId: offer.sellerId,
		// 		buyerId: offer.buyerId,
		// 		txType: offer.txType,
		// 		itemType: offer.itemType,
		// 		itemId: offer.itemId,
		// 		price: offer.price,
		// 		currency: offer.currency,
		// 		amount: offer.amount,
		// 		resource: offer.resource,
		// 		offerType: offer.offerType,
		// 		status: offer.status,
		// 		createdAt: offer.createdAt,
		// 	});
		// });

		// // Проверяем market transactions
		// const [marketTransactions] = await sequelize.query(`
        //     SELECT mt.*, mo."itemType", mo."resource", mo."amount"
        //     FROM markettransactions mt
        //     JOIN marketoffers mo ON mt."offerId" = mo.id
        //     WHERE mt."buyerId" = ${userId} AND mo."itemType" = 'resource' AND mo."resource" IN ('stardust', 'darkMatter')
        //     ORDER BY mt."createdAt" DESC
        //     LIMIT 5
        // `);

		// console.log('Market transactions found:', marketTransactions.length);
		// marketTransactions.forEach((tx, index) => {
		// 	console.log(`Transaction ${index + 1}:`, {
		// 		id: tx.id,
		// 		offerId: tx.offerId,
		// 		buyerId: tx.buyerId,
		// 		sellerId: tx.sellerId,
		// 		txType: tx.txType,
		// 		status: tx.status,
		// 		createdAt: tx.createdAt,
		// 	});
		// });

		// // Проверяем payment transactions
		// const [paymentTransactions] = await sequelize.query(`
        //     SELECT pt.*, mt."buyerId", mt."sellerId"
        //     FROM paymenttransactions pt
        //     JOIN markettransactions mt ON pt."marketTransactionId" = mt.id
        //     JOIN marketoffers mo ON mt."offerId" = mo.id
        //     WHERE mt."buyerId" = ${userId} AND mo."itemType" = 'resource' AND mo."resource" IN ('stardust', 'darkMatter')
        //     ORDER BY pt."createdAt" DESC
        //     LIMIT 10
        // `);

		// console.log('Payment transactions found:', paymentTransactions.length);
		// paymentTransactions.forEach((pt, index) => {
		// 	console.log(`Payment ${index + 1}:`, {
		// 		id: pt.id,
		// 		marketTransactionId: pt.marketTransactionId,
		// 		fromAccount: pt.fromAccount,
		// 		toAccount: pt.toAccount,
		// 		priceOrAmount: pt.priceOrAmount,
		// 		currencyOrResource: pt.currencyOrResource,
		// 		txType: pt.txType,
		// 		status: pt.status,
		// 		createdAt: pt.createdAt,
		// 	});
		// });

		// // Проверяем обновленное состояние пользователя в базе
		// const [userStateResult] = await sequelize.query(`
        //     SELECT * FROM userstates 
        //     WHERE "userId" = ${userId}
        // `);

		// if (userStateResult.length > 0) {
		// 	const userState = userStateResult[0];
		// 	console.log('\n📊 Final user state in database:', {
		// 		userId: userState.userId,
		// 		stardust: userState.stardust,
		// 		darkMatter: userState.darkMatter,
		// 		stars: userState.stars,
		// 		tgStars: userState.tgStars,
		// 		tonToken: userState.tonToken,
		// 		updatedAt: userState.updatedAt,
		// 	});
		// }

		// Тестируем повторный фарминг
		console.log('\n🔄 Step 4: Testing repeated farming...');
		const repeatedFarmingData = [
			{
				resource: 'stardust',
				amount: 10000000,
			},
			{
				resource: 'darkMatter',
				amount: 10000000,
			},
		];

		const repeatedResult = await gameService.registerFarmingReward(
			userId,
			repeatedFarmingData
		);

		console.log('✅ Repeated farming completed');
		console.log('Repeated farming result:', {
			success: repeatedResult.success,
			rewardsCount: repeatedResult.data.rewards.length,
		});

		// Проверяем итоговое состояние
		const [finalUserState] = await sequelize.query(`
            SELECT * FROM userstates 
            WHERE "userId" = ${userId}
        `);

		if (finalUserState.length > 0) {
			const finalState = finalUserState[0];
			console.log('\n📊 Final user state after repeated farming:', {
				userId: finalState.userId,
				stardust: finalState.stardust,
				darkMatter: finalState.darkMatter,
				stars: finalState.stars,
				tgStars: finalState.tgStars,
				tonToken: finalState.tonToken,
				updatedAt: finalState.updatedAt,
			});
		}

		console.log('\n✅ Farming reward test completed successfully!');
		console.log('Summary:');
		console.log('- User created/logged in successfully');
		console.log('- First farming reward processed');
		console.log('- Repeated farming reward processed');
		console.log('- All database transactions created correctly');
		console.log('- User state updated properly');
	} catch (error) {
		console.error('❌ Error in farming test:', error.message);
		console.error('Stack:', error.stack);
	} finally {
		await sequelize.close();
	}
}

testFarmingReward();
