const { Client } = require('pg');

async function forceRemoveConstraints() {
	const client = new Client({
		host: 'localhost',
		port: 5432,
		database: 'nebulahunt_dev',
		user: 'postgres',
		password: '09160130'
	});

	try {
		await client.connect();
		console.log('🔧 Force removing constraints...');

		// First, let's disable all triggers temporarily
		await client.query(`
			ALTER TABLE markettransactions DISABLE TRIGGER ALL;
		`);
		console.log('✅ Disabled all triggers on markettransactions');

		// Now try to drop the constraints
		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_offerId_fkey CASCADE;
		`);
		console.log('✅ Dropped markettransactions_offerId_fkey');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_buyerId_fkey CASCADE;
		`);
		console.log('✅ Dropped markettransactions_buyerId_fkey');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_sellerId_fkey CASCADE;
		`);
		console.log('✅ Dropped markettransactions_sellerId_fkey');

		// Re-enable triggers
		await client.query(`
			ALTER TABLE markettransactions ENABLE TRIGGER ALL;
		`);
		console.log('✅ Re-enabled all triggers on markettransactions');

		console.log('🎉 All non-deferrable constraints force removed!');
		
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
		console.error('❌ Error force removing constraints:', error.message);
	} finally {
		await client.end();
	}
}

forceRemoveConstraints(); 