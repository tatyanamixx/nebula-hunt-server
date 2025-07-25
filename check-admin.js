const { Admin } = require('./models/models');
const sequelize = require('./db');

async function checkAdmin() {
	try {
		await sequelize.authenticate();
		console.log('Database connected successfully.');

		// Проверяем существующих админов
		const admins = await Admin.findAll();
		console.log(
			'All admins:',
			admins.map((a) => ({
				id: a.id,
				email: a.email,
				role: a.role,
				is_2fa_enabled: a.is_2fa_enabled,
			}))
		);

		// Проверяем конкретного супервизора
		const supervisor = await Admin.findOne({
			where: { email: 'tatyanamixx@gmail.com' },
		});

		if (supervisor) {
			console.log('Supervisor found:', {
				id: supervisor.id,
				email: supervisor.email,
				role: supervisor.role,
				is_2fa_enabled: supervisor.is_2fa_enabled,
				blocked: supervisor.blocked,
			});
		} else {
			console.log('Supervisor not found, creating...');

			// Создаем супервизора
			const newSupervisor = await Admin.create({
				email: 'tatyanamixx@gmail.com',
				role: 'SUPERVISOR',
				is_superadmin: true,
				is_2fa_enabled: true,
				name: 'Supervisor',
			});

			console.log('Supervisor created:', {
				id: newSupervisor.id,
				email: newSupervisor.email,
				role: newSupervisor.role,
			});
		}
	} catch (error) {
		console.error('Error:', error.message);
	} finally {
		await sequelize.close();
	}
}

checkAdmin();
