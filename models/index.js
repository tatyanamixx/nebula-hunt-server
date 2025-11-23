"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/database.js")[env];
const db = {};

// Общие настройки безопасности для всех окружений
const securityOptions = {
	// Отключение выполнения необработанных запросов
	quoteIdentifiers: true,
	// Предотвращение использования небезопасных операторов
	operatorsAliases: 0,
	// Дополнительные настройки безопасности пула соединений
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
	// Отключение логирования для предотвращения утечки данных
	logging: false,
};

let sequelize;
if (config.use_env_variable) {
	sequelize = new Sequelize(process.env[config.use_env_variable], {
		...config,
		...securityOptions,
		// dialectOptions из конфига имеет приоритет
		dialectOptions: config.dialectOptions || securityOptions.dialectOptions,
	});
} else {
	// Временное логирование для отладки
	if (env === "production") {
		console.log("[Sequelize] Creating connection with:");
		console.log("[Sequelize]   database:", config.database);
		console.log("[Sequelize]   username:", config.username);
		console.log("[Sequelize]   password type:", typeof config.password);
		console.log(
			"[Sequelize]   password is string:",
			typeof config.password === "string"
		);
		console.log("[Sequelize]   host:", config.host);
		console.log("[Sequelize]   port:", config.port);
		console.log(
			"[Sequelize]   dialectOptions:",
			JSON.stringify(config.dialectOptions)
		);
	}
	// Явно создаем объект конфигурации, чтобы избежать проблем с password
	const sequelizeConfig = {
		host: config.host,
		port: config.port,
		dialect: config.dialect,
		logging:
			config.logging !== undefined ? config.logging : securityOptions.logging,
		pool: config.pool || securityOptions.pool,
		define: config.define || securityOptions.define,
		quoteIdentifiers: securityOptions.quoteIdentifiers,
		operatorsAliases: securityOptions.operatorsAliases,
		// dialectOptions из конфига имеет приоритет
		dialectOptions: config.dialectOptions || securityOptions.dialectOptions,
	};

	// Убеждаемся, что password - это строка и не пустая
	let password = config.password;
	if (!password) {
		throw new Error("Database password is not set!");
	}
	password = String(password);
	if (typeof password !== "string") {
		throw new Error(
			`Database password must be a string, got ${typeof password}`
		);
	}

	// Временное логирование для отладки
	if (env === "production") {
		console.log("[Sequelize] Final password check:");
		console.log("[Sequelize]   password type:", typeof password);
		console.log("[Sequelize]   password length:", password.length);
		console.log(
			"[Sequelize]   password is string:",
			typeof password === "string"
		);
		console.log(
			"[Sequelize]   password value (first 3 chars):",
			password.substring(0, 3)
		);
	}

	sequelize = new Sequelize(
		config.database,
		config.username,
		password, // Используем проверенную строку
		sequelizeConfig
	);
}

// Безопасная загрузка моделей
fs.readdirSync(__dirname)
	.filter((file) => {
		return (
			file.indexOf(".") !== 0 &&
			file !== basename &&
			file.slice(-3) === ".js" &&
			file.indexOf(".test.js") === -1
		);
	})
	.forEach((file) => {
		try {
			const modelModule = require(path.join(__dirname, file));

			// Проверяем, является ли модуль функцией или объектом
			if (typeof modelModule === "function") {
				// Если это функция (старый формат)
				const model = modelModule(sequelize, Sequelize.DataTypes);
				db[model.name] = model;
			} else if (typeof modelModule === "object") {
				// Если это объект (новый формат)
				Object.keys(modelModule).forEach((modelName) => {
					db[modelName] = modelModule[modelName];
				});
			}
		} catch (error) {
			console.error(`Error loading model from file ${file}:`, error);
		}
	});

Object.keys(db).forEach((modelName) => {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
