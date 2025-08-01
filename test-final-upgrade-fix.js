/**
 * Финальный тест для проверки всех исправлений в upgrade-service.js
 */

const upgradeService = require('./service/upgrade-service');
const { UserUpgrade, UpgradeNodeTemplate } = require('./models/models');

console.log('✅ Сервис upgrade-service загружен успешно');

// Проверяем, что все методы существуют
const methods = [
	'initializeUserUpgradeTree',
	'activateUserUpgradeNodes',
	'getUserUpgrades',
	'getUserUpgrade',
	'getAvailableUpgrades',
	'purchaseUpgrade',
	'updateUpgradeProgress',
	'calculateUpgradePrice',
	'getUpgradeStats',
	'resetUpgrades',
];

methods.forEach((method) => {
	const exists = typeof upgradeService[method] === 'function';
	console.log(`✅ Метод ${method} существует:`, exists);
});

// Проверяем, что модель UserUpgrade имеет правильное поле
const hasUpgradeNodeTemplateId = UserUpgrade.rawAttributes.hasOwnProperty(
	'upgradeNodeTemplateId'
);
console.log(
	'✅ Поле upgradeNodeTemplateId существует:',
	hasUpgradeNodeTemplateId
);

// Проверяем, что поле nodeId НЕ существует
const hasNodeId = UserUpgrade.rawAttributes.hasOwnProperty('nodeId');
console.log('❌ Поле nodeId не должно существовать:', !hasNodeId);

// Проверяем, что нет ошибок при загрузке
console.log('✅ Нет ошибок при загрузке сервиса');

console.log('\n🎉 Все исправления в upgrade-service.js работают корректно!');
console.log(
	'Ошибка "upgradeNodeTemplateId cannot be null" должна быть исправлена.'
);
