/**
 * Тест регистрации нового пользователя
 */
const sequelize = require('./db');
const userService = require('./service/user-service');

async function testNewUserRegistration() {
    try {
        console.log('🧪 Testing new user registration process...');
        
        // Тестовые данные для нового пользователя
        const userId = 99999999991; // Новый пользователь
        const username = 'newtestuser';
        const referral = null;
        const galaxyData = {
            seed: 'new-user-seed-' + Date.now(),
            starMin: 100,
            starCurrent: 100,
            price: 0,
            particleCount: 100,
            onParticleCountChange: true,
            galaxyProperties: {}
        };
        
        console.log('✅ Test data prepared');
        console.log('User ID:', userId);
        console.log('Username:', username);
        console.log('Galaxy data:', galaxyData);
        
        // Вызываем login (который создаст нового пользователя)
        const result = await userService.login(userId, username, referral, galaxyData);
        
        console.log('✅ Registration completed successfully');
        console.log('Result keys:', Object.keys(result));
        
        if (result.user) {
            console.log('User:', {
                id: result.user.id,
                username: result.user.username,
                role: result.user.role
            });
        }
        
        if (result.userState) {
            console.log('User state:', {
                userId: result.userState.userId,
                stardust: result.userState.stardust,
                darkMatter: result.userState.darkMatter,
                tgStars: result.userState.tgStars
            });
        }
        
        if (result.galaxy) {
            console.log('Galaxy:', {
                id: result.galaxy.id,
                seed: result.galaxy.seed,
                userId: result.galaxy.userId,
                starCurrent: result.galaxy.starCurrent
            });
        }
        
        // Проверяем, что создались транзакции
        const [marketTransactions] = await sequelize.query(`
            SELECT * FROM markettransactions 
            WHERE "buyerId" = ${userId} OR "sellerId" = ${userId}
            ORDER BY "createdAt" DESC
            LIMIT 5
        `);
        
        console.log('\n📋 Market transactions found:', marketTransactions.length);
        marketTransactions.forEach((tx, index) => {
            console.log(`Transaction ${index + 1}:`, {
                id: tx.id,
                offerId: tx.offerId,
                buyerId: tx.buyerId,
                sellerId: tx.sellerId,
                status: tx.status,
                createdAt: tx.createdAt
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
        
        console.log('\n📋 Payment transactions found:', paymentTransactions.length);
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
                createdAt: pt.createdAt
            });
        });
        
        // Проверяем, что галактика создалась
        const [galaxies] = await sequelize.query(`
            SELECT * FROM galaxies 
            WHERE "userId" = ${userId}
            ORDER BY "createdAt" DESC
            LIMIT 5
        `);
        
        console.log('\n📋 Galaxies found:', galaxies.length);
        galaxies.forEach((galaxy, index) => {
            console.log(`Galaxy ${index + 1}:`, {
                id: galaxy.id,
                seed: galaxy.seed,
                userId: galaxy.userId,
                starCurrent: galaxy.starCurrent,
                createdAt: galaxy.createdAt
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

testNewUserRegistration(); 