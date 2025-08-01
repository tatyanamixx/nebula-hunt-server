const sequelize = require('./db');

async function dropView() {
    try {
        console.log('🗑️ Удаляем view upgrade_node_templates_view...');
        
        await sequelize.query(`
            DROP VIEW IF EXISTS upgrade_node_templates_view;
        `);
        
        console.log('✅ View успешно удален');
        
    } catch (error) {
        console.error('❌ Ошибка при удалении view:', error);
    } finally {
        await sequelize.close();
    }
}

dropView(); 