/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const { Sequelize, DataTypes } = require("sequelize");

// Настройка BIGINT для возврата как BigInt
DataTypes.BIGINT.prototype._sanitize = function _sanitize(value) {
	if (value === null || value === undefined) {
		return null;
	}
	return BigInt(value);
};

if (process.env.NODE_ENV === "production") {
	// Загружаем .env.production
	const path = require("path");
	const envPath = path.resolve(__dirname, ".env.production");
	require("dotenv").config({ path: envPath });

	// В продакшене — используем переменные с суффиксом _PROD
	const dbConfig = {
		database: process.env.DB_NAME_PROD || process.env.DB_NAME,
		username: process.env.DB_USER_PROD || process.env.DB_USER,
		password: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD,
		host: process.env.DB_HOST_PROD || process.env.DB_HOST,
		port: process.env.DB_PORT_PROD || process.env.DB_PORT || 5432,
	};

	console.log("[DB] Production config:", {
		DB_NAME: dbConfig.database,
		DB_USER: dbConfig.username,
		DB_HOST: dbConfig.host,
		DB_PORT: dbConfig.port,
		DIALECT: "postgres",
	});

	module.exports = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "postgres",
			logging: false,
			define: {
				underscored: false, // Используем camelCase для имен колонок
			},
		}
	);
} else {
	// В тестах и разработке — из config/database.js
	const env = process.env.NODE_ENV || "development";
	const config = require("./config/database.js")[env];
	console.log(`[DB] ${env} config:`, {
		DB_NAME: config.database,
		DB_USER: config.username,
		DB_HOST: config.host,
		DB_PORT: config.port,
		DIALECT: config.dialect,
	});
	module.exports = new Sequelize(
		config.database,
		config.username,
		config.password,
		{
			host: config.host,
			port: config.port || 5432,
			dialect: config.dialect,
			logging: false,
			define: {
				underscored: false, // Используем camelCase для имен колонок
			},
		}
	);
}
