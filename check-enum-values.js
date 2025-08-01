const sequelize = require('./db');

async function checkEnumValues() {
	try {
		console.log('🔍 Проверяем значения enum в базе данных...');

		// Проверяем enum для currency в marketoffers
		const [currencyEnum] = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid FROM pg_type WHERE typname = 'enum_marketoffers_currency'
            )
            ORDER BY enumsortorder;
        `);

		console.log('📋 Значения enum_marketoffers_currency:');
		currencyEnum.forEach((value, index) => {
			console.log(`  ${index + 1}. ${value.enumlabel}`);
		});

		// Проверяем enum для currency в upgradenodetemplates
		const [upgradeCurrencyEnum] = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid FROM pg_type WHERE typname = 'enum_upgradenodetemplates_currency'
            )
            ORDER BY enumsortorder;
        `);

		console.log('\n📋 Значения enum_upgradenodetemplates_currency:');
		upgradeCurrencyEnum.forEach((value, index) => {
			console.log(`  ${index + 1}. ${value.enumlabel}`);
		});

		// Проверяем enum для category в upgradenodetemplates
		const [upgradeCategoryEnum] = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid FROM pg_type WHERE typname = 'enum_upgradenodetemplates_category'
            )
            ORDER BY enumsortorder;
        `);

		console.log('\n📋 Значения enum_upgradenodetemplates_category:');
		upgradeCategoryEnum.forEach((value, index) => {
			console.log(`  ${index + 1}. ${value.enumlabel}`);
		});
	} catch (error) {
		console.error('❌ Ошибка при проверке enum значений:', error);
	} finally {
		await sequelize.close();
	}
}

checkEnumValues();
