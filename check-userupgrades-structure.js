const { sequelize } = require('./models/index.js');

async function checkUserUpgradesStructure() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Check the structure of userupgrades table
		const columns = await sequelize.query(
			`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'userupgrades'
            ORDER BY ordinal_position;
        `,
			{ type: sequelize.QueryTypes.SELECT }
		);

		console.log('Columns in userupgrades table:');
		columns.forEach((column) => {
			console.log(
				`- ${column.column_name} (${column.data_type}, nullable: ${column.is_nullable})`
			);
		});
	} catch (error) {
		console.error('Error checking table structure:', error);
	} finally {
		await sequelize.close();
	}
}

checkUserUpgradesStructure();
