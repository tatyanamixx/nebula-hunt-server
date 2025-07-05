/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		dialect: 'postgres',
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
	}
);
