const { Client } = require('pg');

async function checkConstraintDetails() {
	const client = new Client({
		host: 'localhost',
		port: 5432,
		database: 'nebulahunt_dev',
		user: 'postgres',
		password: '09160130'
	});

	try {
		await client.connect();
		console.log('🔍 Getting detailed constraint information...');

		// Get all foreign key constraints with more details
		const result = await client.query(`
			SELECT 
				conname as constraint_name,
				confrelid::regclass as referenced_table,
				condeferrable,
				condeferred,
				confkey as referenced_columns,
				conkey as local_columns,
				oid as constraint_oid
			FROM pg_constraint 
			WHERE conrelid = 'markettransactions'::regclass 
			AND contype = 'f'
			ORDER BY conname;
		`);

		console.log('📋 Detailed constraint information:');
		result.rows.forEach((constraint, index) => {
			console.log(`\n${index + 1}. ${constraint.constraint_name}:`);
			console.log(`   OID: ${constraint.constraint_oid}`);
			console.log(`   Referenced table: ${constraint.referenced_table}`);
			console.log(`   Deferrable: ${constraint.condeferrable}`);
			console.log(`   Initially deferred: ${constraint.condeferred}`);
			console.log(`   Referenced columns: ${constraint.referenced_columns}`);
			console.log(`   Local columns: ${constraint.local_columns}`);
		});

		// Check if there are any duplicate constraint names
		const duplicateResult = await client.query(`
			SELECT conname, COUNT(*) as count
			FROM pg_constraint 
			WHERE conrelid = 'markettransactions'::regclass 
			AND contype = 'f'
			GROUP BY conname
			HAVING COUNT(*) > 1;
		`);

		if (duplicateResult.rows.length > 0) {
			console.log('\n⚠️  Duplicate constraint names found:');
			duplicateResult.rows.forEach(row => {
				console.log(`   ${row.conname}: ${row.count} instances`);
			});
		} else {
			console.log('\n✅ No duplicate constraint names found');
		}

	} catch (error) {
		console.error('❌ Error checking constraints:', error.message);
	} finally {
		await client.end();
	}
}

checkConstraintDetails(); 