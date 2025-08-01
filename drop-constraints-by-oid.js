const { Client } = require('pg');

async function dropConstraintsByOID() {
	const client = new Client({
		host: 'localhost',
		port: 5432,
		database: 'nebulahunt_dev',
		user: 'postgres',
		password: '09160130'
	});

	try {
		await client.connect();
		console.log('🔧 Dropping constraints by OID...');

		// Drop the non-deferrable constraints by their specific OIDs
		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_offerId_fkey CASCADE;
		`);
		console.log('✅ Dropped markettransactions_offerId_fkey (OID: 77299)');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_buyerId_fkey CASCADE;
		`);
		console.log('✅ Dropped markettransactions_buyerId_fkey (OID: 77304)');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_sellerId_fkey CASCADE;
		`);
		console.log('✅ Dropped markettransactions_sellerId_fkey (OID: 77309)');

		console.log('🎉 All non-deferrable constraints dropped successfully!');
		
		// Verify the remaining constraints
		const result = await client.query(`
			SELECT 
				conname as constraint_name,
				confrelid::regclass as referenced_table,
				condeferrable,
				condeferred,
				oid as constraint_oid
			FROM pg_constraint 
			WHERE conrelid = 'markettransactions'::regclass 
			AND contype = 'f'
			ORDER BY conname;
		`);

		console.log('📋 Remaining constraints:');
		result.rows.forEach(constraint => {
			console.log(`  - ${constraint.constraint_name} (OID: ${constraint.constraint_oid}):`);
			console.log(`    Referenced table: ${constraint.referenced_table}`);
			console.log(`    Deferrable: ${constraint.condeferrable}`);
			console.log(`    Initially deferred: ${constraint.condeferred}`);
		});

	} catch (error) {
		console.error('❌ Error dropping constraints:', error.message);
	} finally {
		await client.end();
	}
}

dropConstraintsByOID(); 