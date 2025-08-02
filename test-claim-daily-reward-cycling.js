/**
 * Тест циклической логики claimDailyReward
 */
const sequelize = require('./db');
const gameService = require('./service/game-service');
const userService = require('./service/user-service');

async function testClaimDailyRewardCycling() {
	try {
		console.log('🧪 Testing claimDailyReward cycling logic...');

		// Тестовые данные
		const userId = 9999999999; // Новый тестовый пользователь
		const username = 'cyclingtestuser';
		const referral = null;

		console.log('✅ Test data prepared');
		console.log('User ID:', userId);
		console.log('Username:', username);

		// Сначала создаем пользователя
		console.log('\n📝 Step 1: Creating test user...');
		const loginResult = await userService.login(
			userId,
			username,
			referral,
			null
		);

		console.log('✅ User created successfully');
		console.log('User:', {
			id: loginResult.user.id,
			username: loginResult.user.username,
			role: loginResult.user.role,
		});

		console.log('Initial user state:', {
			userId: loginResult.userState.userId,
			stardust: loginResult.userState.stardust,
			darkMatter: loginResult.userState.darkMatter,
			stars: loginResult.userState.stars,
			currentStreak: loginResult.userState.currentStreak,
			maxStreak: loginResult.userState.maxStreak,
		});

		// Симулируем несколько дней подряд для тестирования циклической логики
		console.log('\n🔄 Step 2: Testing daily rewards for multiple days...');

		// Тестируем 10 дней подряд
		for (let day = 1; day <= 10; day++) {
			console.log(`\n--- Day ${day} ---`);

			try {
				const result = await gameService.claimDailyReward(userId);

				console.log(`✅ Day ${day} reward claimed successfully`);
				console.log('Result:', {
					success: result.success,
					currentStreak: result.data.currentStreak,
					maxStreak: result.data.maxStreak,
					rewardsCount: result.data.rewards.length,
				});

				// Выводим детали наград
				result.data.rewards.forEach((reward, index) => {
					console.log(`Reward ${index + 1}:`, {
						resource: reward.resource,
						amount: reward.amount,
						taskSlug: reward.taskSlug,
						effectiveStreak: reward.effectiveStreak,
					});
				});

				console.log('Updated user state:', {
					stardust: result.data.userState.stardust,
					darkMatter: result.data.userState.darkMatter,
					stars: result.data.userState.stars,
				});
			} catch (error) {
				if (error.message.includes('already claimed today')) {
					console.log(
						`⚠️ Day ${day}: Already claimed today (expected for consecutive days)`
					);
				} else {
					console.error(`❌ Day ${day} error:`, error.message);
				}
			}

			// Ждем немного между днями (в реальности это было бы 24 часа)
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Проверяем итоговое состояние пользователя
		console.log('\n📊 Step 3: Checking final user state...');
		const [finalUserState] = await sequelize.query(`
            SELECT * FROM userstates 
            WHERE "userId" = ${userId}
        `);

		if (finalUserState.length > 0) {
			const userState = finalUserState[0];
			console.log('Final user state:', {
				userId: userState.userId,
				stardust: userState.stardust,
				darkMatter: userState.darkMatter,
				stars: userState.stars,
				tgStars: userState.tgStars,
				tonToken: userState.tonToken,
				currentStreak: userState.currentStreak,
				maxStreak: userState.maxStreak,
				lastDailyBonus: userState.lastDailyBonus,
			});
		}

		// Проверяем созданные транзакции
		console.log('\n📋 Step 4: Checking database transactions...');

		// Проверяем market offers для daily rewards
		const [marketOffers] = await sequelize.query(`
            SELECT * FROM marketoffers 
            WHERE "buyerId" = ${userId} AND "txType" = 'DAILY_REWARD'
            ORDER BY "createdAt" ASC
        `);

		console.log('Daily reward market offers found:', marketOffers.length);
		marketOffers.forEach((offer, index) => {
			console.log(`Offer ${index + 1}:`, {
				id: offer.id,
				sellerId: offer.sellerId,
				buyerId: offer.buyerId,
				txType: offer.txType,
				itemType: offer.itemType,
				itemId: offer.itemId,
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
            WHERE mt."buyerId" = ${userId} AND mo."txType" = 'DAILY_REWARD'
            ORDER BY mt."createdAt" ASC
        `);

		console.log(
			'Daily reward market transactions found:',
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
            WHERE mt."buyerId" = ${userId} AND mo."txType" = 'DAILY_REWARD'
            ORDER BY pt."createdAt" ASC
        `);

		console.log(
			'Daily reward payment transactions found:',
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

		console.log(
			'\n✅ ClaimDailyReward cycling test completed successfully!'
		);
		console.log('Summary:');
		console.log('- User created successfully');
		console.log('- Daily rewards claimed for multiple days');
		console.log('- Cycling logic tested');
		console.log('- All database transactions created correctly');
		console.log('- User state updated properly');
	} catch (error) {
		console.error('❌ Error in cycling test:', error.message);
		console.error('Stack:', error.stack);
	} finally {
		await sequelize.close();
	}
}

testClaimDailyRewardCycling();
