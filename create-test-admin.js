const { Admin } = require('./models/models.js');
const bcrypt = require('bcrypt');

async function createTestAdmin() {
	try {
		console.log('🔐 Создаем тестового администратора...');

		// Проверяем, есть ли уже администратор с таким email
		const existingAdmin = await Admin.findOne({
			where: { email: 'admin@test.com' },
		});

		if (existingAdmin) {
			console.log('✅ Администратор уже существует:', {
				id: existingAdmin.id,
				email: existingAdmin.email,
				role: existingAdmin.role,
				hasPassword: !!existingAdmin.password,
			});

			// Если у него нет пароля, добавляем
			if (!existingAdmin.password) {
				const hashedPassword = await bcrypt.hash('TestPass123!', 10);
				await existingAdmin.update({
					password: hashedPassword,
					passwordChangedAt: new Date(),
					passwordExpiresAt: new Date(
						Date.now() + 90 * 24 * 60 * 60 * 1000
					), // 90 дней
				});
				console.log(
					'✅ Пароль добавлен к существующему администратору'
				);
			}

			return;
		}

		// Создаем нового администратора
		const hashedPassword = await bcrypt.hash('TestPass123!', 10);

		const admin = await Admin.create({
			email: 'admin@test.com',
			name: 'Test Admin',
			role: 'ADMIN',
			password: hashedPassword,
			passwordChangedAt: new Date(),
			passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 дней
			blocked: false,
			loginAttempts: 0,
			lockedUntil: null,
		});

		console.log('✅ Тестовый администратор создан:', {
			id: admin.id,
			email: admin.email,
			role: admin.role,
			hasPassword: !!admin.password,
		});

		console.log('📝 Данные для входа:');
		console.log('   Email: admin@test.com');
		console.log('   Пароль: TestPass123!');
	} catch (error) {
		console.error('❌ Ошибка создания администратора:', error);
	}
}

createTestAdmin()
	.then(() => {
		console.log('✅ Скрипт завершен');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Ошибка:', error);
		process.exit(1);
	});
