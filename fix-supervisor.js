const { Admin } = require('./models/models');
const sequelize = require('./db');

async function fixSupervisor() {
	try {
		await sequelize.authenticate();
		console.log('Database connected successfully.');

		// Удаляем существующего супервизора с ID = 0
		await Admin.destroy({
			where: {
				email: 'tatyanamixx@gmail.com',
				id: 0,
			},
		});
		console.log('Removed invalid supervisor record');

		// Создаем нового супервизора
		const newSupervisor = await Admin.create({
			email: 'tatyanamixx@gmail.com',
			role: 'SUPERVISOR',
			is_superadmin: true,
			is_2fa_enabled: true,
			name: 'Supervisor',
		});

		console.log('New supervisor created:', {
			id: newSupervisor.id,
			email: newSupervisor.email,
			role: newSupervisor.role,
			is_2fa_enabled: newSupervisor.is_2fa_enabled,
		});

		// Проверяем, что супервизор создан правильно
		const supervisor = await Admin.findOne({
			where: { email: 'tatyanamixx@gmail.com' },
		});

		if (supervisor) {
			console.log('Supervisor verification:', {
				id: supervisor.id,
				email: supervisor.email,
				role: supervisor.role,
				is_2fa_enabled: supervisor.is_2fa_enabled,
			});
		} else {
			console.log('ERROR: Supervisor not found after creation');
		}
	} catch (error) {
		console.error('Error:', error.message);
	} finally {
		await sequelize.close();
	}
}

fixSupervisor();
