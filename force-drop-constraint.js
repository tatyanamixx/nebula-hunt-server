const { sequelize } = require('./models/index.js');

async function forceDropConstraint() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// First, let's check if the constraint exists
		const constraints = await sequelize.query(
			`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'userupgrades' 
            AND constraint_name = 'userupgrades_upgradeNodeTemplateId_fkey';
        `,
			{ type: sequelize.QueryTypes.SELECT }
		);

		console.log('Found constraints:', constraints);

		if (constraints.length > 0) {
			// Try to drop the constraint with the exact name from the database
			await sequelize.query(`
                ALTER TABLE userupgrades DROP CONSTRAINT "userupgrades_upgradeNodeTemplateId_fkey" CASCADE;
            `);
			console.log('Constraint dropped with exact name');
		} else {
			console.log('Constraint not found with exact name');

			// Try with lowercase name
			await sequelize.query(`
                ALTER TABLE userupgrades DROP CONSTRAINT "userupgrades_upgradenodetemplateid_fkey" CASCADE;
            `);
			console.log('Constraint dropped with lowercase name');
		}

		// Check again
		const remainingConstraints = await sequelize.query(
			`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'userupgrades' 
            AND constraint_name LIKE '%upgrade%';
        `,
			{ type: sequelize.QueryTypes.SELECT }
		);

		console.log(
			'Remaining upgrade-related constraints:',
			remainingConstraints
		);
	} catch (error) {
		console.error('Error dropping constraint:', error);
	} finally {
		await sequelize.close();
	}
}

forceDropConstraint();
