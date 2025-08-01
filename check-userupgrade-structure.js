const { sequelize } = require('./models/models');

async function checkUserUpgradeStructure() {
	console.log('🔍 Проверка структуры таблицы userupgrades...\n');

	try {
		// Проверяем структуру таблицы userupgrades
		const [results] = await sequelize.query(`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns 
			WHERE table_name = 'userupgrades' 
			ORDER BY ordinal_position;
		`);

		console.log('📋 Структура таблицы userupgrades:');
		console.table(results);

		// Проверяем, есть ли колонка upgradeNodeTemplateId
		const hasUpgradeNodeTemplateId = results.some(col => col.column_name === 'upgradenodetemplateid');
		console.log(`\n✅ Колонка upgradenodetemplateid существует: ${hasUpgradeNodeTemplateId}`);

		// Проверяем, есть ли колонка nodeId (старое название)
		const hasNodeId = results.some(col => col.column_name === 'nodeid');
		console.log(`❌ Колонка nodeid не должна существовать: ${!hasNodeId}`);

		// Проверяем все колонки на предмет возможных вариантов названия
		const possibleColumns = results
			.filter(col => col.column_name.toLowerCase().includes('node') || col.column_name.toLowerCase().includes('template'))
			.map(col => col.column_name);

		console.log('\n🔍 Возможные колонки для связи с upgrade node:');
		console.log(possibleColumns);

	} catch (error) {
		console.error('❌ Ошибка при проверке структуры:', error.message);
	} finally {
		await sequelize.close();
	}
}

checkUserUpgradeStructure(); 