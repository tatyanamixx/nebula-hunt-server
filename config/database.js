require('dotenv').config();

module.exports = {
	development: {
		username: 'postgres',
		password: '09160130',
		database: 'nebulahunt_dev',
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 5432,
		dialect: 'postgres',
		logging: console.log,
	},
	test: {
		username: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'postgres',
		database: process.env.DB_NAME || 'nebulahunt_test',
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 5432,
		dialect: 'postgres',
		logging: false,
	},
	production: {
		username: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'postgres',
		database: process.env.DB_NAME || 'nebulahunt',
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 5432,
		dialect: 'postgres',
		logging: false,
	},
};
