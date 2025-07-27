const { Admin } = require('./models/models.js');
const bcrypt = require('bcrypt');

async function addPasswordToAdmin() {
	try {
		console.log('🔐 Ищем администраторов...');

		// Получаем всех администраторов
		const admins = await Admin.findAll();

		if (admins.length === 0) {
			console.log('❌ Администраторы не найдены');
			return;
		}

		console.log('📋 Найденные администраторы:');
		admins.forEach((admin, index) => {
			console.log(
				`${index + 1}. ID: ${admin.id}, Email: ${admin.email}, Role: ${
					admin.role
				}, Has Password: ${!!admin.password}`
			);
		});

		// Берем первого администратора без пароля или первого вообще
		const adminToUpdate = admins.find((a) => !a.password) || admins[0];

		if (!adminToUpdate) {
			console.log('❌ Не найден администратор для обновления');
			return;
		}

		console.log(`\n🔐 Обновляем администратора: ${adminToUpdate.email}`);

		// Создаем хеш пароля
		const password = 'TestPass123!';
		const hashedPassword = await bcrypt.hash(password, 10);

		// Обновляем администратора
		await adminToUpdate.update({
			password: hashedPassword,
			passwordChangedAt: new Date(),
			passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 дней
			loginAttempts: 0,
			lockedUntil: null,
		});

		console.log('✅ Пароль успешно добавлен!');
		console.log('📝 Данные для входа:');
		console.log(`   Email: ${adminToUpdate.email}`);
		console.log(`   Пароль: ${password}`);
	} catch (error) {
		console.error('❌ Ошибка:', error);
	}
}

addPasswordToAdmin()
	.then(() => {
		console.log('✅ Скрипт завершен');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Ошибка:', error);
		process.exit(1);
	});
