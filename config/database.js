// Загружаем правильный .env файл в зависимости от окружения
const path = require("path");
const env = process.env.NODE_ENV || "development";
if (env === "production") {
	const envPath = path.resolve(__dirname, "..", ".env.production");
	const result = require("dotenv").config({ path: envPath });
	// Временный лог для отладки
	console.log("[DB] Loading .env.production from:", envPath);
	console.log(
		"[DB] Dotenv result:",
		result.error ? "ERROR: " + result.error.message : "OK"
	);
	console.log("[DB] DB_HOST_PROD:", process.env.DB_HOST_PROD);
	console.log("[DB] DB_PORT_PROD:", process.env.DB_PORT_PROD);
	console.log("[DB] DB_NAME_PROD:", process.env.DB_NAME_PROD);
	console.log("[DB] DB_USER_PROD:", process.env.DB_USER_PROD);
	console.log("[DB] DB_PASSWORD_PROD type:", typeof process.env.DB_PASSWORD_PROD);
	console.log(
		"[DB] DB_PASSWORD_PROD length:",
		process.env.DB_PASSWORD_PROD
			? process.env.DB_PASSWORD_PROD.length
			: "undefined"
	);
	console.log("[DB] DB_SSL:", process.env.DB_SSL);
} else {
	require("dotenv").config();
}

module.exports = {
	development: {
		username: process.env.DB_USER_DEV || process.env.DB_USER || "postgres",
		password:
			process.env.DB_PASSWORD_DEV || process.env.DB_PASSWORD || "09160130",
		database: process.env.DB_NAME_DEV || process.env.DB_NAME || "nebulahunt_dev",
		host: process.env.DB_HOST_DEV || process.env.DB_HOST || "localhost",
		port: process.env.DB_PORT_DEV || process.env.DB_PORT || 5432,
		dialect: "postgres",
		logging: process.env.DB_LOGGING === "true" ? console.log : false,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
		define: {
			timestamps: true,
			underscored: true,
		},
	},
	test: {
		username: process.env.DB_USER_TEST || process.env.DB_USER || "postgres",
		password:
			process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD || "09160130",
		database:
			process.env.DB_NAME_TEST || process.env.DB_NAME || "nebulahunt_test",
		host: process.env.DB_HOST_TEST || process.env.DB_HOST || "localhost",
		port: process.env.DB_PORT_TEST || process.env.DB_PORT || 5432,
		dialect: "postgres",
		logging: false,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
		define: {
			timestamps: true,
			underscored: true,
		},
	},
	production: {
		username: process.env.DB_USER_PROD || process.env.DB_USER || "postgres",
		password: String(
			process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD || "postgres"
		),
		database: process.env.DB_NAME_PROD || process.env.DB_NAME || "nebulahunt",
		host: process.env.DB_HOST_PROD || process.env.DB_HOST || "localhost",
		port: process.env.DB_PORT_PROD || process.env.DB_PORT || 5432,
		dialect: "postgres",
		logging: false,
		pool: {
			max: 10,
			min: 2,
			acquire: 30000,
			idle: 10000,
		},
		define: {
			timestamps: true,
			underscored: true,
		},
		dialectOptions: {
			// Отключаем SSL для локального подключения между VPS
			ssl: false,
		},
	},
};
