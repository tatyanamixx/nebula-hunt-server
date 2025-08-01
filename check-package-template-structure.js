const { sequelize } = require('./models/index.js');

async function checkPackageTemplateStructure() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Check the structure of packagetemplates table
		const columns = await sequelize.query(
			`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'packagetemplates'
            ORDER BY ordinal_position;
        `,
			{ type: sequelize.QueryTypes.SELECT }
		);

		console.log('Columns in packagetemplates table:');
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

checkPackageTemplateStructure();
