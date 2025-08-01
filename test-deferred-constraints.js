/**
 * Тест отложенных ограничений
 */
const sequelize = require('./db');
const { SYSTEM_USER_ID } = require('./config/constants');

async function testDeferredConstraints() {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('🧪 Testing deferred constraints...');
        
        // 1. Устанавливаем отложенные ограничения
        console.log('1. Setting constraints to deferred...');
        await sequelize.query('SET CONSTRAINTS ALL DEFERRED', { transaction });
        
        // 2. Проверяем, что пользователь не существует
        const userId = 99999999997;
        console.log(`2. Checking if user ${userId} exists...`);
        const [existingUser] = await sequelize.query(`
            SELECT id FROM users WHERE id = ${userId}
        `, { transaction });
        
        if (existingUser.length > 0) {
            console.log('❌ User already exists, cannot test');
            return;
        }
        
        console.log('✅ User does not exist, proceeding with test');
        
        // 3. Создаем MarketOffer (это должно работать)
        console.log('3. Creating MarketOffer...');
        const [offerResult] = await sequelize.query(`
            INSERT INTO marketoffers ("sellerId", "itemType", "itemId", "price", "currency", "offerType", "amount", "resource", "status", "createdAt", "updatedAt")
            VALUES (${SYSTEM_USER_ID}, 'galaxy', 1, 0, 'tonToken', 'SYSTEM', 100, 'stars', 'COMPLETED', NOW(), NOW())
            RETURNING id
        `, { transaction });
        
        const offerId = offerResult[0].id;
        console.log(`✅ MarketOffer created with ID: ${offerId}`);
        
        // 4. Пытаемся создать MarketTransaction с несуществующим пользователем
        console.log('4. Creating MarketTransaction with non-existent user...');
        const [transactionResult] = await sequelize.query(`
            INSERT INTO markettransactions ("offerId", "buyerId", "sellerId", "status", "createdAt", "completedAt", "updatedAt")
            VALUES (${offerId}, ${userId}, ${SYSTEM_USER_ID}, 'COMPLETED', NOW(), NOW(), NOW())
            RETURNING id
        `, { transaction });
        
        console.log(`✅ MarketTransaction created with ID: ${transactionResult[0].id}`);
        
        // 5. Создаем пользователя
        console.log('5. Creating user...');
        await sequelize.query(`
            INSERT INTO users ("id", "username", "role", "createdAt", "updatedAt")
            VALUES (${userId}, 'testuser', 'USER', NOW(), NOW())
        `, { transaction });
        
        console.log('✅ User created');
        
        // 6. Коммитим транзакцию
        console.log('6. Committing transaction...');
        await transaction.commit();
        
        console.log('✅ Transaction committed successfully!');
        console.log('✅ Deferred constraints worked correctly!');
        
        // 7. Проверяем, что все создалось
        const [finalCheck] = await sequelize.query(`
            SELECT 
                u.id as user_id,
                u.username,
                mo.id as offer_id,
                mt.id as transaction_id
            FROM users u
            JOIN markettransactions mt ON u.id = mt."buyerId"
            JOIN marketoffers mo ON mt."offerId" = mo.id
            WHERE u.id = ${userId}
        `);
        
        console.log('📋 Final check results:', finalCheck);
        
    } catch (error) {
        console.error('❌ Error in test:', error.message);
        console.error('Stack:', error.stack);
        if (!transaction.finished) {
            await transaction.rollback();
        }
    } finally {
        await sequelize.close();
    }
}

testDeferredConstraints(); 