/**
 * Тест отложенных ограничений
 */
const sequelize = require('./db');
const { SYSTEM_USER_ID } = require('./config/constants');

async function testConstraints() {
	const transaction = await sequelize.transaction();

	try {
		console.log('🧪 Testing deferred constraints...');

		// Откладываем проверку всех ограничений
		await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
			transaction: transaction,
		});
		console.log('✅ SET CONSTRAINTS ALL DEFERRED executed');

		// Проверяем, что системный пользователь существует
		const [systemUser] = await sequelize.query(
			`
            SELECT id, username, role 
            FROM users 
            WHERE id = ${SYSTEM_USER_ID}
        `,
			{ transaction: transaction }
		);

		if (systemUser.length === 0) {
			throw new Error(
				`System user with ID ${SYSTEM_USER_ID} does not exist`
			);
		}
		console.log(`✅ System user exists: ${systemUser[0].username}`);

		// Проверяем, что обычный пользователь существует
		const [regularUser] = await sequelize.query(
			`
            SELECT id, username, role 
            FROM users 
            WHERE id = 882562608
        `,
			{ transaction: transaction }
		);

		if (regularUser.length === 0) {
			throw new Error('Regular user with ID 882562608 does not exist');
		}
		console.log(`✅ Regular user exists: ${regularUser[0].username}`);

		// Создаем тестовое предложение
		const [offer] = await sequelize.query(
			`
            INSERT INTO marketoffers ("sellerId", "itemType", "itemId", "price", "currency", "offerType", "amount", "resource", "txType", "status", "isItemLocked", "createdAt", "updatedAt")
            VALUES (${SYSTEM_USER_ID}, 'test', 1, 0, 'tonToken', 'SYSTEM', 1, 'stars', 'TEST', 'ACTIVE', false, NOW(), NOW())
            RETURNING id
        `,
			{ transaction: transaction }
		);

		console.log(`✅ Created test offer with ID: ${offer[0].id}`);

		// Пытаемся создать транзакцию (это должно вызвать ошибку)
		try {
			await sequelize.query(
				`
                INSERT INTO markettransactions ("offerId", "buyerId", "sellerId", "status", "createdAt", "completedAt", "updatedAt")
                VALUES (${offer[0].id}, ${SYSTEM_USER_ID}, 882562608, 'COMPLETED', NOW(), NOW(), NOW())
            `,
				{ transaction: transaction }
			);

			console.log(
				'✅ Transaction created successfully (constraints deferred)'
			);
		} catch (error) {
			console.log('❌ Error creating transaction:', error.message);
		}

		// Откатываем транзакцию
		await transaction.rollback();
		console.log('✅ Transaction rolled back');
	} catch (error) {
		console.error('❌ Error in test:', error.message);
		await transaction.rollback();
	} finally {
		await sequelize.close();
	}
}

testConstraints();
