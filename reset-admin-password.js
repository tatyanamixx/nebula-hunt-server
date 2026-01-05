/**
 * Скрипт для сброса пароля администратора
 * Использование:
 *   node reset-admin-password.js                    - показать всех админов
 *   node reset-admin-password.js <email>             - сбросить пароль для админа с указанным email
 *   node reset-admin-password.js <email> <password>  - установить конкретный пароль
 */

const { Admin } = require('./models/models.js');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
	try {
		// Получаем аргументы командной строки
		const args = process.argv.slice(2);
		const email = args[0];
		const newPassword = args[1];

		console.log('🔐 Поиск администраторов...\n');

		// Получаем всех администраторов
		const admins = await Admin.findAll({
			attributes: ['id', 'email', 'name', 'role', 'password', 'blocked', 'is_2fa_enabled'],
			order: [['id', 'ASC']],
		});

		if (admins.length === 0) {
			console.log('❌ Администраторы не найдены');
			return;
		}

		// Показываем всех админов
		console.log('📋 Найденные администраторы:');
		console.log('='.repeat(80));
		admins.forEach((admin, index) => {
			console.log(`${index + 1}. ID: ${admin.id}`);
			console.log(`   Email: ${admin.email}`);
			console.log(`   Name: ${admin.name || 'N/A'}`);
			console.log(`   Role: ${admin.role}`);
			console.log(`   Has Password: ${admin.password ? '✅ Да' : '❌ Нет'}`);
			console.log(`   Blocked: ${admin.blocked ? '❌ Да' : '✅ Нет'}`);
			console.log(`   2FA Enabled: ${admin.is_2fa_enabled ? '✅ Да' : '❌ Нет'}`);
			console.log('');
		});
		console.log('='.repeat(80));

		// Если не указан email, просто показываем список
		if (!email) {
			console.log('\n💡 Для сброса пароля используйте:');
			console.log('   node reset-admin-password.js <email>');
			console.log('   node reset-admin-password.js <email> <newPassword>');
			return;
		}

		// Ищем админа по email
		const adminToUpdate = admins.find((a) => a.email.toLowerCase() === email.toLowerCase());

		if (!adminToUpdate) {
			console.log(`\n❌ Администратор с email "${email}" не найден`);
			return;
		}

		console.log(`\n🔐 Обновляем администратора: ${adminToUpdate.email}`);

		// Генерируем пароль или используем указанный
		const password = newPassword || 'AdminPass123!';
		const hashedPassword = await bcrypt.hash(password, 10);

		// Обновляем администратора
		await adminToUpdate.update({
			password: hashedPassword,
			passwordChangedAt: new Date(),
			passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 дней
			loginAttempts: 0,
			lockedUntil: null,
			blocked: false, // Разблокируем, если был заблокирован
		});

		console.log('✅ Пароль успешно установлен!');
		console.log('\n📝 Данные для входа:');
		console.log('='.repeat(80));
		console.log(`   Email: ${adminToUpdate.email}`);
		console.log(`   Пароль: ${password}`);
		console.log('='.repeat(80));
		console.log('\n⚠️  ВАЖНО: Сохраните эти данные в безопасном месте!');
	} catch (error) {
		console.error('❌ Ошибка:', error.message);
		console.error(error.stack);
	}
}

resetAdminPassword()
	.then(() => {
		console.log('\n✅ Скрипт завершен');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Критическая ошибка:', error);
		process.exit(1);
	});

