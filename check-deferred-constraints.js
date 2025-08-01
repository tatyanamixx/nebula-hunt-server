/**
 * Проверка настроек отложенных ограничений
 */
const sequelize = require('./db');

async function checkDeferredConstraints() {
    try {
        console.log('🔍 Checking deferred constraints configuration...');
        
        // Проверяем настройки ограничений для markettransactions
        const [constraints] = await sequelize.query(`
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule,
                rc.update_rule,
                pg_get_constraintdef(pgc.oid) as constraint_definition
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            JOIN information_schema.referential_constraints AS rc ON tc.constraint_name = rc.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
            JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'markettransactions'
            ORDER BY tc.constraint_name;
        `);
        
        console.log('\n📋 Foreign key constraints for markettransactions:');
        constraints.forEach((constraint, index) => {
            console.log(`Constraint ${index + 1}:`, {
                name: constraint.constraint_name,
                table: constraint.table_name,
                column: constraint.column_name,
                foreignTable: constraint.foreign_table_name,
                foreignColumn: constraint.foreign_column_name,
                deleteRule: constraint.delete_rule,
                updateRule: constraint.update_rule,
                definition: constraint.constraint_definition
            });
        });
        
        // Проверяем, какие ограничения отложены
        const [deferredConstraints] = await sequelize.query(`
            SELECT 
                conname as constraint_name,
                pg_get_constraintdef(oid) as constraint_definition,
                condeferrable,
                condeferred
            FROM pg_constraint 
            WHERE conrelid = 'markettransactions'::regclass 
            AND contype = 'f'
        `);
        
        console.log('\n📋 Deferred constraints details:');
        deferredConstraints.forEach((constraint, index) => {
            console.log(`Constraint ${index + 1}:`, {
                name: constraint.constraint_name,
                definition: constraint.constraint_definition,
                deferrable: constraint.condeferrable,
                initiallyDeferred: constraint.condeferred
            });
        });
        
        // Проверяем текущие настройки сессии
        const [sessionSettings] = await sequelize.query(`
            SHOW constraint_exclusion;
        `);
        
        console.log('\n📋 Session constraint settings:', sessionSettings);
        
    } catch (error) {
        console.error('❌ Error checking constraints:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkDeferredConstraints(); 