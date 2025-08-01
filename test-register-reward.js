/**
 * Тест исправленного registerReward
 */
const sequelize = require('./db');
const { SYSTEM_USER_ID } = require('./config/constants');
const gameService = require('./service/game-service');

async function testRegisterReward() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('🧪 Testing registerReward...');
        
        // Тестовые данные
        const offerData = {
            sellerId: SYSTEM_USER_ID,
            itemType: 'task',
            itemId: 1,
            price: 0,
            currency: 'tonToken',
            offerType: 'SYSTEM',
            amount: 10,
            resource: 'stardust',
        };
        
        const userId = 882562608; // Существующий пользователь
        const txType = 'TASK_REWARD';
        
        console.log('✅ Test data prepared');
        console.log('Offer data:', offerData);
        console.log('User ID:', userId);
        console.log('Transaction type:', txType);
        
        // Вызываем registerReward
        const result = await gameService.registerReward(offerData, userId, transaction, txType);
        
        console.log('✅ registerReward completed successfully');
        console.log('Result:', result);
        
        // Откатываем транзакцию
        await transaction.rollback();
        console.log('✅ Transaction rolled back');
        
    } catch (error) {
        console.error('❌ Error in test:', error.message);
        console.error('Stack:', error.stack);
        await transaction.rollback();
    } finally {
        await sequelize.close();
    }
}

testRegisterReward(); 