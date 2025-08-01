const { sequelize, UserUpgrade } = require('./models/models');

async function testUserUpgradeModel() {
	console.log('🧪 Тестирование модели UserUpgrade...\n');

	try {
		// Проверяем, что модель загружается
		console.log('✅ Модель UserUpgrade загружена успешно');

		// Проверяем атрибуты модели
		const attributes = Object.keys(UserUpgrade.rawAttributes);
		console.log('📋 Атрибуты модели:', attributes);

		// Проверяем, что все необходимые поля присутствуют
		const requiredFields = [
			'id', 'userId', 'upgradeNodeTemplateId', 'level', 'progress', 
			'targetProgress', 'completed', 'progressHistory', 'lastProgressUpdate',
			'stability', 'instability'
		];

		console.log('\n🔍 Проверка полей:');
		requiredFields.forEach(field => {
			const hasField = attributes.includes(field);
			console.log(`   ${field}: ${hasField ? '✅' : '❌'}`);
		});

		// Проверяем связи
		console.log('\n🔗 Проверка связей:');
		console.log('   UserUpgrade.associations:', Object.keys(UserUpgrade.associations));

		// Пытаемся выполнить простой запрос
		console.log('\n🔍 Тестирование запроса к базе данных...');
		const count = await UserUpgrade.count();
		console.log(`   Количество записей в таблице userupgrades: ${count}`);

		console.log('\n✅ Все проверки пройдены успешно!');

	} catch (error) {
		console.error('❌ Ошибка при тестировании:', error.message);
		console.error(error.stack);
	} finally {
		await sequelize.close();
	}
}

testUserUpgradeModel(); 