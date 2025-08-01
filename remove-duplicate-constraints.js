const sequelize = require('./db.js');

async function removeDuplicateConstraints() {
	const transaction = await sequelize.transaction();
	
	try {
		console.log('🔧 Removing duplicate non-deferrable constraints...');
		
		// Remove the old non-deferrable constraints
		await sequelize.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_offerId_fkey;
		`, { transaction });
		console.log('✅ Removed markettransactions_offerId_fkey');

		await sequelize.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_buyerId_fkey;
		`, { transaction });
		console.log('✅ Removed markettransactions_buyerId_fkey');

		await sequelize.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_sellerId_fkey;
		`, { transaction });
		console.log('✅ Removed markettransactions_sellerId_fkey');

		// Commit the transaction
		await transaction.commit();
		console.log('🎉 All duplicate constraints removed successfully!');
		
		// Verify the remaining constraints
		const [results] = await sequelize.query(`
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
		results.forEach(constraint => {
			console.log(`  - ${constraint.constraint_name}:`);
			console.log(`    Referenced table: ${constraint.referenced_table}`);
			console.log(`    Deferrable: ${constraint.condeferrable}`);
			console.log(`    Initially deferred: ${constraint.condeferred}`);
		});

	} catch (error) {
		await transaction.rollback();
		console.error('❌ Error removing constraints:', error.message);
	} finally {
		await sequelize.close();
	}
}

removeDuplicateConstraints(); 