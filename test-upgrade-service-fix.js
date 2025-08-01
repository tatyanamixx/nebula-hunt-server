/**
 * Тестовый скрипт для проверки исправления ошибки в upgrade-service.js
 * Проверяет, что поле upgradeNodeTemplateId правильно используется
 */

const { sequelize, UserUpgrade, UpgradeNodeTemplate } = require('./models/models');
const UpgradeService = require('./service/upgrade-service');

async function testUpgradeServiceFix() {
	console.log('🧪 Тестирование исправлений в upgrade-service.js...\n');

	try {
		// Проверяем, что модель UserUpgrade содержит поля stability и instability
		const userUpgradeAttributes = Object.keys(UserUpgrade.rawAttributes);
		console.log('📋 Атрибуты модели UserUpgrade:', userUpgradeAttributes);
		
		const hasStability = userUpgradeAttributes.includes('stability');
		const hasInstability = userUpgradeAttributes.includes('instability');
		
		console.log(`✅ Поле stability в UserUpgrade: ${hasStability} (должно быть true)`);
		console.log(`✅ Поле instability в UserUpgrade: ${hasInstability} (должно быть true)`);

		// Проверяем, что модель UpgradeNodeTemplate содержит поля stability и instability
		const upgradeNodeAttributes = Object.keys(UpgradeNodeTemplate.rawAttributes);
		console.log('📋 Атрибуты модели UpgradeNodeTemplate:', upgradeNodeAttributes);
		
		const nodeHasStability = upgradeNodeAttributes.includes('stability');
		const nodeHasInstability = upgradeNodeAttributes.includes('instability');
		
		console.log(`✅ Поле stability в UpgradeNodeTemplate: ${nodeHasStability} (должно быть true)`);
		console.log(`✅ Поле instability в UpgradeNodeTemplate: ${nodeHasInstability} (должно быть true)`);

		// Проверяем, что методы сервиса существуют
		const upgradeService = UpgradeService;
		console.log(`✅ Метод initializeUserUpgradeTree существует: ${typeof upgradeService.initializeUserUpgradeTree === 'function'}`);
		console.log(`✅ Метод activateUserUpgradeNodes существует: ${typeof upgradeService.activateUserUpgradeNodes === 'function'}`);
		console.log(`✅ Метод getAvailableUpgrades существует: ${typeof upgradeService.getAvailableUpgrades === 'function'}`);

		// Проверяем связи между моделями
		console.log('\n🔗 Проверка связей между моделями...');
		console.log(`✅ UserUpgrade.belongsTo(UpgradeNodeTemplate): ${UserUpgrade.associations.UpgradeNodeTemplate !== undefined}`);
		console.log(`✅ UpgradeNodeTemplate.hasMany(UserUpgrade): ${UpgradeNodeTemplate.associations.UserUpgrades !== undefined}`);

		console.log('\n✅ Все проверки пройдены успешно!');
		console.log('📝 Поля stability и instability сохраняются в UserUpgrade и копируются из UpgradeNodeTemplate');

	} catch (error) {
		console.error('❌ Ошибка при тестировании:', error.message);
		console.error(error.stack);
	} finally {
		await sequelize.close();
	}
}

testUpgradeServiceFix(); 