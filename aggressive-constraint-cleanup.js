const { Client } = require('pg');

async function aggressiveCleanup() {
	const client = new Client({
		host: 'localhost',
		port: 5432,
		database: 'nebulahunt_dev',
		user: 'postgres',
		password: '09160130',
	});

	try {
		await client.connect();
		console.log('🔧 Aggressive constraint cleanup...');

		// 1. Отключаем ВСЕ триггеры
		console.log('📋 Disabling all triggers...');
		await client.query(`
			ALTER TABLE markettransactions DISABLE TRIGGER ALL;
		`);
		console.log('✅ All triggers disabled');

		// 2. Удаляем ВСЕ ограничения принудительно
		console.log('📋 Force removing all constraints...');

		const constraints = [
			'markettransactions_offerId_fkey',
			'markettransactions_buyerId_fkey',
			'markettransactions_sellerId_fkey',
			'markettransactions_offer_id_fk',
			'markettransactions_buyer_id_fk',
			'markettransactions_seller_id_fk',
		];

		for (const constraint of constraints) {
			try {
				await client.query(`
					ALTER TABLE markettransactions 
					DROP CONSTRAINT IF EXISTS ${constraint} CASCADE;
				`);
				console.log(`✅ Removed ${constraint}`);
			} catch (error) {
				console.log(
					`⚠️  Could not remove ${constraint}: ${error.message}`
				);
			}
		}

		// 3. Проверяем, что все удалено
		const checkResult = await client.query(`
			SELECT 
				conname as constraint_name,
				condeferrable,
				condeferred
			FROM pg_constraint 
			WHERE conrelid = 'markettransactions'::regclass 
			AND contype = 'f';
		`);

		if (checkResult.rows.length === 0) {
			console.log('✅ All constraints removed successfully!');
		} else {
			console.log('⚠️  Some constraints still exist:');
			checkResult.rows.forEach((constraint) => {
				console.log(
					`  - ${constraint.constraint_name} (deferrable: ${constraint.condeferrable})`
				);
			});
		}

		// 4. Создаем только правильные ограничения
		console.log('📋 Creating new deferrable constraints...');

		await client.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_offer_id_fk 
			FOREIGN KEY ("offerId") REFERENCES marketoffers(id) 
			ON DELETE CASCADE ON UPDATE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
		console.log('✅ Created markettransactions_offer_id_fk');

		await client.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_buyer_id_fk 
			FOREIGN KEY ("buyerId") REFERENCES users(id) 
			ON DELETE CASCADE ON UPDATE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
		console.log('✅ Created markettransactions_buyer_id_fk');

		await client.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_seller_id_fk 
			FOREIGN KEY ("sellerId") REFERENCES users(id) 
			ON DELETE CASCADE ON UPDATE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
		console.log('✅ Created markettransactions_seller_id_fk');

		// 5. Включаем триггеры обратно
		console.log('📋 Re-enabling triggers...');
		await client.query(`
			ALTER TABLE markettransactions ENABLE TRIGGER ALL;
		`);
		console.log('✅ All triggers re-enabled');

		// 6. Финальная проверка
		const finalResult = await client.query(`
			SELECT 
				conname as constraint_name,
				confrelid::regclass as referenced_table,
				condeferrable,
				condeferred
			FROM pg_constraint 
			WHERE conrelid = 'markettransactions'::regclass 
			AND contype = 'f'
			ORDER BY conname;
		`);

		console.log('📋 Final constraints:');
		finalResult.rows.forEach((constraint) => {
			console.log(`  - ${constraint.constraint_name}:`);
			console.log(`    Referenced table: ${constraint.referenced_table}`);
			console.log(`    Deferrable: ${constraint.condeferrable}`);
			console.log(`    Initially deferred: ${constraint.condeferred}`);
		});
	} catch (error) {
		console.error('❌ Error in aggressive cleanup:', error.message);
	} finally {
		await client.end();
	}
}

aggressiveCleanup();
