require('./config/database.js');
const sequelize = require('./db.js');

async function checkConstraints() {
	try {
		// Check existing constraints
		const constraintsResult = await sequelize.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'CHECK'
      ORDER BY tc.table_name, tc.constraint_name;
    `);

		console.log('Existing CHECK constraints:');
		constraintsResult[0].forEach((constraint) => {
			console.log(
				`- ${constraint.table_name}.${constraint.constraint_name} (${constraint.constraint_type})`
			);
		});

		// Check existing indexes
		const indexesResult = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

		console.log('\nExisting indexes (idx_*):');
		indexesResult[0].forEach((index) => {
			console.log(`- ${index.tablename}.${index.indexname}`);
		});

		process.exit(0);
	} catch (err) {
		console.error('Error:', err.message);
		process.exit(1);
	}
}

checkConstraints();
