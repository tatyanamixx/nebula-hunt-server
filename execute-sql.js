const { sequelize } = require('./models/models');

async function executeSQL() {
	try {
		await sequelize.authenticate();
		console.log('Database connected successfully.');

		// Очистка дублирующихся записей супервизоров
		const deleteResult = await sequelize.query(`
            DELETE FROM admins 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM admins 
                WHERE email = 'tatyanamixx@gmail.com' AND role = 'SUPERVISOR'
                GROUP BY email
            )
        `);

		console.log('Deleted duplicate records:', deleteResult[1].rowCount);

		// Добавляем уникальный индекс на поле email
		await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique ON admins(email)
        `);

		console.log('Unique index created successfully');

		// Проверяем результат
		const [results] = await sequelize.query(`
            SELECT id, email, role, is_2fa_enabled, name 
            FROM admins 
            WHERE email = 'tatyanamixx@gmail.com' AND role = 'SUPERVISOR'
        `);

		console.log('\nRemaining supervisors:');
		results.forEach((row) => {
			console.log(
				`ID: ${row.id}, Email: ${row.email}, Role: ${row.role}, 2FA: ${row.is_2fa_enabled}`
			);
		});
	} catch (error) {
		console.error('Error:', error.message);
	} finally {
		await sequelize.close();
	}
}

executeSQL();
