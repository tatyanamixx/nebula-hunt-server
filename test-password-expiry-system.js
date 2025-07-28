const { passwordExpiryService } = require('./service/password-expiry-service');
const { adminService } = require('./service/admin-service');
const { logger } = require('./config/logger.config');

/**
 * Тестирование системы оповещения о истечении паролей
 */
async function testPasswordExpirySystem() {
	try {
		console.log(
			'🧪 Тестирование системы оповещения о истечении паролей...\n'
		);

		// 1. Проверяем текущих админов
		console.log('1. Проверка текущих админов...');
		const admins = await adminService.getAllAdmins();
		console.log(`Найдено админов: ${admins.length}`);

		for (const admin of admins) {
			const now = new Date();
			const daysUntilExpiry = Math.ceil(
				(admin.passwordExpiresAt - now) / (1000 * 60 * 60 * 24)
			);
			console.log(
				`- ${admin.email}: пароль истекает через ${daysUntilExpiry} дней`
			);
		}

		// 2. Запускаем проверку истечения паролей
		console.log('\n2. Запуск проверки истечения паролей...');
		await passwordExpiryService.checkPasswordExpiry();
		console.log('✅ Проверка завершена');

		// 3. Проверяем статус после проверки
		console.log('\n3. Проверка статуса после проверки...');
		for (const admin of admins) {
			const status = await adminService.getPasswordInfo(admin.id);
			console.log(
				`- ${admin.email}: заблокирован=${status.isLocked}, уведомлен=${admin.passwordExpiryNotified}`
			);
		}

		console.log('\n✅ Тестирование завершено успешно!');
	} catch (error) {
		console.error('❌ Ошибка при тестировании:', error);
		logger.error('Error in password expiry test:', error);
	}
}

/**
 * Тестирование отправки уведомлений
 */
async function testNotifications() {
	try {
		console.log('📧 Тестирование отправки уведомлений...\n');

		const admins = await adminService.getAllAdmins();

		if (admins.length === 0) {
			console.log('Нет админов для тестирования');
			return;
		}

		const testAdmin = admins[0];
		console.log(`Тестируем на админе: ${testAdmin.email}`);

		// Симулируем истечение пароля через 3 дня
		const threeDaysFromNow = new Date();
		threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

		await testAdmin.update({
			passwordExpiresAt: threeDaysFromNow,
			passwordExpiryNotified: false,
		});

		console.log('✅ Дата истечения пароля установлена на 3 дня вперед');
		console.log(
			'Теперь запустите проверку: node test-password-expiry-system.js'
		);
	} catch (error) {
		console.error('❌ Ошибка при тестировании уведомлений:', error);
	}
}

/**
 * Сброс тестовых данных
 */
async function resetTestData() {
	try {
		console.log('🔄 Сброс тестовых данных...\n');

		const admins = await adminService.getAllAdmins();

		for (const admin of admins) {
			// Устанавливаем нормальную дату истечения (90 дней)
			const normalExpiry = new Date();
			normalExpiry.setDate(normalExpiry.getDate() + 90);

			await admin.update({
				passwordExpiresAt: normalExpiry,
				passwordExpiryNotified: false,
				isLocked: false,
			});
		}

		console.log('✅ Тестовые данные сброшены');
	} catch (error) {
		console.error('❌ Ошибка при сбросе данных:', error);
	}
}

// Обработка аргументов командной строки
const command = process.argv[2];

switch (command) {
	case 'test':
		testPasswordExpirySystem();
		break;
	case 'notifications':
		testNotifications();
		break;
	case 'reset':
		resetTestData();
		break;
	default:
		console.log(`
🧪 Тестирование системы оповещения о истечении паролей

Использование:
  node test-password-expiry-system.js test        - Запуск полного тестирования
  node test-password-expiry-system.js notifications - Тестирование уведомлений
  node test-password-expiry-system.js reset       - Сброс тестовых данных

Примеры:
  node test-password-expiry-system.js notifications
  node test-password-expiry-system.js test
  node test-password-expiry-system.js reset
        `);
}
