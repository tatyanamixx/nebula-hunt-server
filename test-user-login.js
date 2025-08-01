/**
 * Тест полного процесса логина/регистрации
 */
const sequelize = require('./db');
const userService = require('./service/user-service');

async function testUserLogin() {
	try {
		console.log('🧪 Testing user login/registration process...');

		// Тестовые данные
		const userId = 6666666666; // Существующий пользователь
		const username = 'testuser';
		const referral = null;
		const galaxyData = {
			seed: 'test-login-seed-' + Date.now(),
			starMin: 100,
			starCurrent: 123456,
			price: 0,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {},
		};

		console.log('✅ Test data prepared');
		console.log('User ID:', userId);
		console.log('Username:', username);
		console.log('Galaxy data:', galaxyData);

		// Вызываем login (который может создать нового пользователя)
		const result = await userService.login(
			userId,
			username,
			referral,
			galaxyData
		);

		console.log('✅ Login/registration completed successfully');
		console.log('Result keys:', Object.keys(result));

		if (result.user) {
			console.log('User:', {
				id: result.user.id,
				username: result.user.username,
				role: result.user.role,
			});
		}

		if (result.userState) {
			console.log('User state:', {
				userId: result.userState.userId,
				stardust: result.userState.stardust,
				darkMatter: result.userState.darkMatter,
				tgStars: result.userState.tgStars,
			});
		}

		if (result.galaxy) {
			console.log('Galaxy:', {
				id: result.galaxy.id,
				seed: result.galaxy.seed,
				userId: result.galaxy.userId,
				starCurrent: result.galaxy.starCurrent,
			});
		}

		// Проверяем, что создались транзакции
		const [marketTransactions] = await sequelize.query(`
            SELECT * FROM markettransactions 
            WHERE "buyerId" = ${userId} OR "sellerId" = ${userId}
            ORDER BY "createdAt" DESC
            LIMIT 5
        `);

		console.log(
			'\n📋 Market transactions found:',
			marketTransactions.length
		);
		marketTransactions.forEach((tx, index) => {
			console.log(`Transaction ${index + 1}:`, {
				id: tx.id,
				offerId: tx.offerId,
				buyerId: tx.buyerId,
				sellerId: tx.sellerId,
				status: tx.status,
				createdAt: tx.createdAt,
			});
		});

		const [paymentTransactions] = await sequelize.query(`
            SELECT pt.*, mt."buyerId", mt."sellerId"
            FROM paymenttransactions pt
            JOIN markettransactions mt ON pt."marketTransactionId" = mt.id
            WHERE mt."buyerId" = ${userId} OR mt."sellerId" = ${userId}
            ORDER BY pt."createdAt" DESC
            LIMIT 10
        `);

		console.log(
			'\n📋 Payment transactions found:',
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

		console.log('\n✅ Test completed successfully');
	} catch (error) {
		console.error('❌ Error in test:', error.message);
		console.error('Stack:', error.stack);
	} finally {
		await sequelize.close();
	}
}

testUserLogin();
