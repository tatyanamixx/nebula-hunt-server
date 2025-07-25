const { Admin } = require('./models/models');
const sequelize = require('./db');

async function cleanupSupervisors() {
	try {
		await sequelize.authenticate();
		console.log('Database connected successfully.');

		const supervisorEmail = 'tatyanamixx@gmail.com';

		// Находим всех супервизоров с этим email
		const supervisors = await Admin.findAll({
			where: {
				email: supervisorEmail,
				role: 'SUPERVISOR',
			},
			order: [['id', 'ASC']],
		});

		console.log(
			`Found ${supervisors.length} supervisors with email: ${supervisorEmail}`
		);

		if (supervisors.length > 1) {
			// Оставляем только первого (с наименьшим ID)
			const supervisorToKeep = supervisors[0];
			const supervisorsToDelete = supervisors.slice(1);

			console.log(`Keeping supervisor with ID: ${supervisorToKeep.id}`);
			console.log(
				`Deleting ${supervisorsToDelete.length} duplicate supervisors...`
			);

			// Удаляем дубликаты
			for (const supervisor of supervisorsToDelete) {
				await Admin.destroy({
					where: { id: supervisor.id },
				});
				console.log(`Deleted supervisor with ID: ${supervisor.id}`);
			}

			console.log('Cleanup completed successfully!');
		} else if (supervisors.length === 1) {
			console.log(
				`Only one supervisor found with ID: ${supervisors[0].id}`
			);
		} else {
			console.log('No supervisors found!');
		}

		// Проверяем результат
		const remainingSupervisors = await Admin.findAll({
			where: {
				email: supervisorEmail,
				role: 'SUPERVISOR',
			},
		});

		console.log(
			`\nFinal result: ${remainingSupervisors.length} supervisor(s) remaining`
		);
		if (remainingSupervisors.length > 0) {
			const supervisor = remainingSupervisors[0];
			console.log('Supervisor details:', {
				id: supervisor.id,
				email: supervisor.email,
				role: supervisor.role,
				is_2fa_enabled: supervisor.is_2fa_enabled,
				name: supervisor.name,
			});
		}
	} catch (error) {
		console.error('Error:', error.message);
	} finally {
		await sequelize.close();
	}
}

cleanupSupervisors();
