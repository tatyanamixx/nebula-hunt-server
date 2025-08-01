const sequelize = require('./db');
const { User, UserState, Galaxy, UserUpgrade, MarketTransaction, Token, MarketOffer, PackageStore, PackageTemplate, PaymentTransaction, EventTemplate, TaskTemplate, UpgradeNodeTemplate } = require('./models/models');

async function checkDatabaseVsModels() {
    try {
        console.log('🔍 Сравниваем структуру БД с моделями...\n');
        
        // Проверяем основные таблицы
        const tables = [
            { name: 'users', model: User },
            { name: 'userstates', model: UserState },
            { name: 'galaxies', model: Galaxy },
            { name: 'userupgrades', model: UserUpgrade },
            { name: 'markettransactions', model: MarketTransaction },
            { name: 'tokens', model: Token },
            { name: 'marketoffers', model: MarketOffer },
            { name: 'packagestore', model: PackageStore },
            { name: 'packagetemplate', model: PackageTemplate },
            { name: 'paymenttransactions', model: PaymentTransaction },
            { name: 'eventtemplates', model: EventTemplate },
            { name: 'tasktemplates', model: TaskTemplate },
            { name: 'upgradenodetemplates', model: UpgradeNodeTemplate }
        ];
        
        for (const table of tables) {
            console.log(`📋 Проверяем таблицу: ${table.name}`);
            
            // Получаем колонки из БД
            const [dbColumns] = await sequelize.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '${table.name}' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `);
            
            // Получаем поля из модели
            const modelFields = Object.keys(table.model.rawAttributes);
            
            console.log(`  БД колонки (${dbColumns.length}):`, dbColumns.map(c => c.column_name).join(', '));
            console.log(`  Модель поля (${modelFields.length}):`, modelFields.join(', '));
            
            // Находим лишние колонки в БД
            const extraColumns = dbColumns
                .map(c => c.column_name)
                .filter(col => !modelFields.includes(col));
            
            if (extraColumns.length > 0) {
                console.log(`  ❌ Лишние колонки в БД:`, extraColumns.join(', '));
            } else {
                console.log(`  ✅ Все колонки соответствуют модели`);
            }
            
            // Находим отсутствующие колонки в БД
            const missingColumns = modelFields.filter(field => 
                !dbColumns.some(c => c.column_name === field)
            );
            
            if (missingColumns.length > 0) {
                console.log(`  ❌ Отсутствующие колонки в БД:`, missingColumns.join(', '));
            }
            
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при проверке:', error);
    } finally {
        await sequelize.close();
    }
}

checkDatabaseVsModels(); 