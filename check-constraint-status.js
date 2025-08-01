const sequelize = require('./db.js');

async function checkAllConstraintStatus() {
	try {
		console.log('🔍 Проверяем статус всех ограничений...\n');

		const result = await sequelize.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule,
        tc.is_deferrable,
        tc.initially_deferred
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name;
    `);

		console.log('📋 Все найденные ограничения:');
		console.table(result[0]);

		if (result[0].length === 0) {
			console.log('❌ Ограничения не найдены!');
		} else {
			console.log('\n✅ Ограничения найдены!');

			// Группируем по таблицам
			const tableGroups = {};
			result[0].forEach((row) => {
				if (!tableGroups[row.table_name]) {
					tableGroups[row.table_name] = [];
				}
				tableGroups[row.table_name].push(row);
			});

			console.log('\n📊 Статистика по таблицам:');
			Object.keys(tableGroups).forEach((tableName) => {
				const constraints = tableGroups[tableName];
				const deferrableCount = constraints.filter(
					(row) => row.is_deferrable === 'YES'
				).length;
				const initiallyDeferredCount = constraints.filter(
					(row) => row.initially_deferred === 'YES'
				).length;

				console.log(`\n${tableName}:`);
				console.log(`  Всего ограничений: ${constraints.length}`);
				console.log(
					`  Deferrable: ${deferrableCount}/${constraints.length}`
				);
				console.log(
					`  Initially Deferred: ${initiallyDeferredCount}/${constraints.length}`
				);

				if (deferrableCount < constraints.length) {
					console.log(
						`  ⚠️  ${
							constraints.length - deferrableCount
						} ограничений НЕ deferrable!`
					);
				}
			});

			// Общая статистика
			const totalConstraints = result[0].length;
			const totalDeferrable = result[0].filter(
				(row) => row.is_deferrable === 'YES'
			).length;
			const totalInitiallyDeferred = result[0].filter(
				(row) => row.initially_deferred === 'YES'
			).length;

			console.log('\n📈 Общая статистика:');
			console.log(`Всего ограничений: ${totalConstraints}`);
			console.log(`Deferrable: ${totalDeferrable}/${totalConstraints}`);
			console.log(
				`Initially Deferred: ${totalInitiallyDeferred}/${totalConstraints}`
			);

			if (totalDeferrable < totalConstraints) {
				console.log(
					`\n⚠️  ВНИМАНИЕ: ${
						totalConstraints - totalDeferrable
					} ограничений НЕ deferrable!`
				);
				console.log(
					'Это может вызвать проблемы при регистрации пользователей.'
				);
			}
		}
	} catch (error) {
		console.error('❌ Ошибка при проверке ограничений:', error);
	} finally {
		await sequelize.close();
	}
}

checkAllConstraintStatus();
