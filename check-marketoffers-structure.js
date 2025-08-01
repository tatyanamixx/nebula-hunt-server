/**
 * Проверка структуры таблицы marketoffers
 */
const sequelize = require('./db');

async function checkMarketOffersStructure() {
	try {
		console.log('🔍 Checking marketoffers table structure...');

		// Получаем информацию о колонках
		const [columns] = await sequelize.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'marketoffers'
            ORDER BY ordinal_position;
        `);

		console.log('\n📋 MarketOffers columns:');
		columns.forEach((column) => {
			console.log(
				`✅ ${column.column_name}: ${column.data_type} ${
					column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
				}`
			);
		});

		// Проверяем, есть ли колонка txType
		const hasTxType = columns.some((col) => col.column_name === 'txType');
		console.log(
			`\n📋 Has txType column: ${hasTxType ? '✅ YES' : '❌ NO'}`
		);

		await sequelize.close();
	} catch (error) {
		console.error(
			'❌ Error checking marketoffers structure:',
			error.message
		);
		await sequelize.close();
	}
}

checkMarketOffersStructure();
