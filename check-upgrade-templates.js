const sequelize = require('./db');

async function checkUpgradeTemplates() {
    try {
        console.log('🔍 Проверяем структуру таблицы upgradenodetemplates...');
        
        const [results] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'upgradenodetemplates' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Структура таблицы upgradenodetemplates:');
        results.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Проверяем существующие записи
        const [records] = await sequelize.query('SELECT COUNT(*) as count FROM upgradenodetemplates;');
        console.log(`\n📊 Количество записей в таблице: ${records[0].count}`);
        
        if (records[0].count > 0) {
            const [sampleRecords] = await sequelize.query('SELECT * FROM upgradenodetemplates LIMIT 3;');
            console.log('\n📝 Примеры записей:');
            sampleRecords.forEach((record, index) => {
                console.log(`  Запись ${index + 1}:`, record);
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка при проверке таблицы:', error);
    } finally {
        await sequelize.close();
    }
}

checkUpgradeTemplates();
