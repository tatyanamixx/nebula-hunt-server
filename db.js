/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const { Sequelize, DataTypes } = require('sequelize');

// Настройка BIGINT для возврата как BigInt
DataTypes.BIGINT.prototype._sanitize = function _sanitize(value) {
	if (value === null || value === undefined) {
		return null;
	}
	return BigInt(value);
};

if (process.env.NODE_ENV === 'production') {
	// В продакшене — только переменные окружения
	console.log('[DB] Production config:', {
		DB_NAME: process.env.DB_NAME,
		DB_USER: process.env.DB_USER,
		DB_HOST: process.env.DB_HOST,
		DB_PORT: process.env.DB_PORT,
		DIALECT: 'postgres',
	});
	module.exports = new Sequelize(
		process.env.DB_NAME,
		process.env.DB_USER,
		process.env.DB_PASSWORD,
		{
			host: process.env.DB_HOST,
			port: process.env.DB_PORT || 5432,
			dialect: 'postgres',
			logging: false,
			define: {
				underscored: false, // Используем camelCase для имен колонок
			},
		}
	);
} else {
	// В тестах и разработке — из config/database.js
	const env = process.env.NODE_ENV || 'development';
	const config = require('./config/database.js')[env];
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
