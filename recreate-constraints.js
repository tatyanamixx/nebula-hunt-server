const { Client } = require('pg');

async function recreateConstraints() {
	const client = new Client({
		host: 'localhost',
		port: 5432,
		database: 'nebulahunt_dev',
		user: 'postgres',
		password: '09160130',
	});

	try {
		await client.connect();
		console.log('🔧 Recreating markettransactions constraints...');

		// 1. Удаляем ВСЕ существующие ограничения
		console.log('📋 Removing all existing constraints...');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_offerId_fkey CASCADE;
		`);
		console.log('✅ Removed markettransactions_offerId_fkey');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_buyerId_fkey CASCADE;
		`);
		console.log('✅ Removed markettransactions_buyerId_fkey');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_sellerId_fkey CASCADE;
		`);
		console.log('✅ Removed markettransactions_sellerId_fkey');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_offer_id_fk CASCADE;
		`);
		console.log('✅ Removed markettransactions_offer_id_fk');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_buyer_id_fk CASCADE;
		`);
		console.log('✅ Removed markettransactions_buyer_id_fk');

		await client.query(`
			ALTER TABLE markettransactions 
			DROP CONSTRAINT IF EXISTS markettransactions_seller_id_fk CASCADE;
		`);
		console.log('✅ Removed markettransactions_seller_id_fk');

		// 2. Создаем только правильные deferrable ограничения
		console.log('📋 Creating new deferrable constraints...');

		await client.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_offer_id_fk 
			FOREIGN KEY ("offerId") REFERENCES marketoffers(id) 
			ON DELETE CASCADE ON UPDATE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
		console.log('✅ Created markettransactions_offer_id_fk (deferrable)');

		await client.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_buyer_id_fk 
			FOREIGN KEY ("buyerId") REFERENCES users(id) 
			ON DELETE CASCADE ON UPDATE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
		console.log('✅ Created markettransactions_buyer_id_fk (deferrable)');

		await client.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_seller_id_fk 
			FOREIGN KEY ("sellerId") REFERENCES users(id) 
			ON DELETE CASCADE ON UPDATE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
		console.log('✅ Created markettransactions_seller_id_fk (deferrable)');

		console.log('🎉 All constraints recreated successfully!');

		// 3. Проверяем результат
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

		console.log('📋 Final constraints:');
		result.rows.forEach((constraint) => {
			console.log(
				`  - ${constraint.constraint_name} (OID: ${constraint.constraint_oid}):`
			);
			console.log(`    Referenced table: ${constraint.referenced_table}`);
			console.log(`    Deferrable: ${constraint.condeferrable}`);
			console.log(`    Initially deferred: ${constraint.condeferred}`);
		});
	} catch (error) {
		console.error('❌ Error recreating constraints:', error.message);
	} finally {
		await client.end();
	}
}

recreateConstraints();
