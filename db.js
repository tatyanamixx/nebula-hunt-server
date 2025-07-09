/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const { Sequelize } = require('sequelize');

if (process.env.NODE_ENV === 'production') {
	// В продакшене — только переменные окружения
	module.exports = new Sequelize(
		process.env.DB_NAME,
		process.env.DB_USER,
		process.env.DB_PASSWORD,
		{
			host: process.env.DB_HOST,
			port: process.env.DB_PORT || 5432,
			dialect: 'postgres',
			logging: false,
		}
	);
} else {
	// В тестах и разработке — из config/config.json
	const env = process.env.NODE_ENV || 'development';
	const config = require('./config/config.json')[env];
	module.exports = new Sequelize(
		config.database,
		config.username,
		config.password,
		{
			host: config.host,
			port: config.port || 5432,
			dialect: config.dialect,
			logging: false,
		}
	);
}
