const { sequelize } = require("./models");

async function clearDatabase() {
	try {
		console.log("🔄 Начинаю очистку базы данных...");

		// Пытаемся отключить проверку внешних ключей (требует прав суперпользователя)
		// Если нет прав - продолжаем, CASCADE удалит все связанные объекты
		try {
			await sequelize.query("SET session_replication_role = replica;");
			console.log("ℹ️  Проверка внешних ключей отключена");
		} catch (permError) {
			console.log("ℹ️  Нет прав на session_replication_role, продолжаю без него (CASCADE удалит связанные объекты)");
		}

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

		// Пытаемся включить обратно проверку внешних ключей
		try {
			await sequelize.query("SET session_replication_role = DEFAULT;");
		} catch (permError) {
			// Игнорируем ошибку, если нет прав
		}

		console.log("✅ База данных успешно очищена!");
	} catch (error) {
		console.error("❌ Ошибка при очистке базы данных:", error);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

clearDatabase();
