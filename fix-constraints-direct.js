const { Client } = require('pg');

async function fixConstraints() {
	const client = new Client({
		host: 'localhost',
		port: 5432,
		database: 'nebulahunt_dev',
		user: 'postgres',
		password: '09160130'
	});

	try {
		await client.connect();
		console.log('🔧 Connected to database, removing duplicate constraints...');

		// Remove the old non-deferrable constraints
		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_offerId_fkey;
		`);
		console.log('✅ Removed markettransactions_offerId_fkey');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_buyerId_fkey;
		`);
		console.log('✅ Removed markettransactions_buyerId_fkey');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_sellerId_fkey;
		`);
		console.log('✅ Removed markettransactions_sellerId_fkey');

		console.log('🎉 All duplicate constraints removed successfully!');
		
		// Verify the remaining constraints
		const result = await client.query(`
			SELECT 
				conname as constraint_name,
				confrelid::regclass as referenced_table,
				condeferrable,
				condeferred
			FROM pg_constraint 
			WHERE conrelid = 'markettransactions'::regclass 
			AND contype = 'f';
		`);

		console.log('📋 Remaining constraints:');
		result.rows.forEach(constraint => {
			console.log(`  - ${constraint.constraint_name}:`);
			console.log(`    Referenced table: ${constraint.referenced_table}`);
			console.log(`    Deferrable: ${constraint.condeferrable}`);
			console.log(`    Initially deferred: ${constraint.condeferred}`);
		});

	} catch (error) {
		console.error('❌ Error removing constraints:', error.message);
	} finally {
		await client.end();
	}
}

fixConstraints(); 