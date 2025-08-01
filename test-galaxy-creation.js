/**
 * Тест создания галактики и транзакций
 */
const sequelize = require('./db');
const { SYSTEM_USER_ID } = require('./config/constants');
const gameService = require('./service/game-service');

async function testGalaxyCreation() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('🧪 Testing galaxy creation and transactions...');
        
        // Тестовые данные галактики
        const galaxyData = {
            seed: 'test-seed-' + Date.now(),
            starMin: 100,
            starCurrent: 100,
            price: 0,
            particleCount: 100,
            onParticleCountChange: true,
            galaxyProperties: {}
        };
        
        const buyerId = 882562608; // Существующий пользователь
        
        console.log('✅ Test data prepared');
        console.log('Galaxy data:', galaxyData);
        console.log('Buyer ID:', buyerId);
        console.log('System user ID:', SYSTEM_USER_ID);
        
        // Вызываем createGalaxyAsGift
        const result = await gameService.createGalaxyAsGift(galaxyData, buyerId, transaction);
        
        console.log('✅ Galaxy creation completed successfully');
        console.log('Result keys:', Object.keys(result));
        if (result.galaxy) {
            console.log('Galaxy:', {
                id: result.galaxy.id,
                seed: result.galaxy.seed,
                userId: result.galaxy.userId,
                starCurrent: result.galaxy.starCurrent
            });
        }
        if (result.marketOffer) {
            console.log('Market offer:', {
                offerId: result.marketOffer.offer?.id,
                marketTransactionId: result.marketOffer.marketTransaction?.id,
                paymentId: result.marketOffer.payment?.id,
                transferResourceId: result.marketOffer.transferResource?.id
            });
        }
        
        // Проверяем, что создались записи в базе данных
        const [marketTransactions] = await sequelize.query(`
            SELECT * FROM markettransactions 
            WHERE "buyerId" = ${buyerId} OR "sellerId" = ${buyerId}
            ORDER BY "createdAt" DESC
            LIMIT 5
        `, { transaction });
        
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
            WHERE mt."buyerId" = ${buyerId} OR mt."sellerId" = ${buyerId}
            ORDER BY pt."createdAt" DESC
            LIMIT 10
        `, { transaction });
        
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
        
        // Откатываем транзакцию
        await transaction.rollback();
        console.log('\n✅ Transaction rolled back');
        
    } catch (error) {
        console.error('❌ Error in test:', error.message);
        console.error('Stack:', error.stack);
        await transaction.rollback();
    } finally {
        await sequelize.close();
    }
}

testGalaxyCreation(); 