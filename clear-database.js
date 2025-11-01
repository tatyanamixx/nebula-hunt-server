const { sequelize } = require("./models");

async function clearDatabase() {
	try {
		console.log("🔄 Начинаю очистку базы данных...");

		// Отключаем проверку внешних ключей
		await sequelize.query("SET session_replication_role = replica;");

		// Получаем список всех таблиц
		const tables = await sequelize.query(
			"SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
			{ type: sequelize.QueryTypes.SELECT }
		);

		console.log(`📋 Найдено таблиц: ${tables.length}`);

		// Удаляем все таблицы
		for (const table of tables) {
			const tableName = table.tablename;
			console.log(`🗑️  Удаляю таблицу: ${tableName}`);
			await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
		}

		// Включаем обратно проверку внешних ключей
		await sequelize.query("SET session_replication_role = DEFAULT;");

		console.log("✅ База данных успешно очищена!");
	} catch (error) {
		console.error("❌ Ошибка при очистке базы данных:", error);
	} finally {
		await sequelize.close();
	}
}

clearDatabase();
