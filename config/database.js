require('dotenv').config();

module.exports = {
	development: {
		username: process.env.DB_USER_DEV || process.env.DB_USER || 'postgres',
		password:
			process.env.DB_PASSWORD_DEV ||
			process.env.DB_PASSWORD ||
			'09160130',
		database:
			process.env.DB_NAME_DEV || process.env.DB_NAME || 'nebulahunt_dev',
		host: process.env.DB_HOST_DEV || process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT_DEV || process.env.DB_PORT || 5432,
		dialect: 'postgres',
		logging: process.env.DB_LOGGING === 'true' ? console.log : false,
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
		username: process.env.DB_USER_TEST || process.env.DB_USER || 'postgres',
		password:
			process.env.DB_PASSWORD_TEST ||
			process.env.DB_PASSWORD ||
			'09160130',
		database:
			process.env.DB_NAME_TEST ||
			process.env.DB_NAME ||
			'nebulahunt_test',
		host: process.env.DB_HOST_TEST || process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT_TEST || process.env.DB_PORT || 5432,
		dialect: 'postgres',
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
		username: process.env.DB_USER_PROD || process.env.DB_USER || 'postgres',
		password:
			process.env.DB_PASSWORD_PROD ||
			process.env.DB_PASSWORD ||
			'postgres',
		database:
			process.env.DB_NAME_PROD || process.env.DB_NAME || 'nebulahunt',
		host: process.env.DB_HOST_PROD || process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT_PROD || process.env.DB_PORT || 5432,
		dialect: 'postgres',
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
		dialectOptions:
			process.env.DB_SSL === 'true'
				? {
						ssl: {
							require: true,
							rejectUnauthorized:
								process.env.DB_SSL_REJECT_UNAUTHORIZED ===
								'true',
							ca: process.env.DB_SSL_CA_PATH
								? require('fs').readFileSync(
										process.env.DB_SSL_CA_PATH
								  )
								: undefined,
							cert: process.env.DB_SSL_CERT_PATH
								? require('fs').readFileSync(
										process.env.DB_SSL_CERT_PATH
								  )
								: undefined,
							key: process.env.DB_SSL_KEY_PATH
								? require('fs').readFileSync(
										process.env.DB_SSL_KEY_PATH
								  )
								: undefined,
						},
				  }
				: {},
	},
};
