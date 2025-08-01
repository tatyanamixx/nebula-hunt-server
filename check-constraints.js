/**
 * Проверка ограничений внешних ключей
 */
const sequelize = require('./db');

async function checkConstraints() {
	try {
		console.log('🔍 Checking foreign key constraints...');

		// Проверяем ограничения для markettransactions
		const [constraints] = await sequelize.query(`
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule,
                rc.update_rule
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.referential_constraints AS rc
                    ON tc.constraint_name = rc.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = 'markettransactions'
            ORDER BY tc.constraint_name;
        `);

		console.log('\n📋 Foreign key constraints for markettransactions:');
		if (constraints.length === 0) {
			console.log('❌ No foreign key constraints found!');
		} else {
			constraints.forEach((constraint) => {
				console.log(`✅ ${constraint.constraint_name}:`);
				console.log(
					`   Table: ${constraint.table_name}.${constraint.column_name}`
				);
				console.log(
					`   References: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`
				);
				console.log(`   Delete rule: ${constraint.delete_rule}`);
				console.log(`   Update rule: ${constraint.update_rule}`);
				console.log('');
			});
		}

		// Проверяем, есть ли отложенные ограничения
		const [deferredConstraints] = await sequelize.query(`
            SELECT 
                conname as constraint_name,
                pg_get_constraintdef(oid) as constraint_definition
            FROM pg_constraint 
            WHERE conrelid = 'markettransactions'::regclass
                AND contype = 'f'
        `);

		console.log('\n📋 Deferred constraints for markettransactions:');
		if (deferredConstraints.length === 0) {
			console.log('❌ No deferred constraints found!');
		} else {
			deferredConstraints.forEach((constraint) => {
				console.log(`✅ ${constraint.constraint_name}:`);
				console.log(
					`   Definition: ${constraint.constraint_definition}`
				);
				console.log('');
			});
		}

		// Проверяем, есть ли пользователь с ID 882562608 (sellerId из ошибки)
		const [seller] = await sequelize.query(`
            SELECT id, username, role 
            FROM users 
            WHERE id = 882562608
        `);

		console.log('\n📋 Seller user check:');
		if (seller.length === 0) {
			console.log('❌ Seller user with ID 882562608 does not exist!');
		} else {
			console.log(
				`✅ Seller user exists: ID ${seller[0].id}, Username: ${seller[0].username}, Role: ${seller[0].role}`
			);
		}

		await sequelize.close();
	} catch (error) {
		console.error('❌ Error checking constraints:', error.message);
		await sequelize.close();
	}
}

checkConstraints();
