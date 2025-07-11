const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
	dialect: 'postgres',
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 5432,
	username: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || 'postgres',
	database: process.env.DB_NAME || 'nebulahunt',
	logging: console.log,
});

async function testConnection() {
	try {
		console.log('Testing database connection...');
		console.log('Connection details:', {
			host: process.env.DB_HOST || 'localhost',
			port: process.env.DB_PORT || 5432,
			database: process.env.DB_NAME || 'nebulahunt',
			username: process.env.DB_USER || 'postgres',
		});

		await sequelize.authenticate();
		console.log('✅ Database connection successful!');

		// Test if database exists
		const [results] = await sequelize.query('SELECT current_database()');
		console.log('Current database:', results[0].current_database);
	} catch (error) {
		console.error('❌ Database connection failed:', error.message);

		if (error.code === 'ECONNREFUSED') {
			console.log('\n💡 PostgreSQL is not running. Please:');
			console.log('1. Install and start PostgreSQL, or');
			console.log(
				'2. Use Docker: docker run --name nebulahunt-postgres -e POSTGRES_DB=nebulahunt -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine'
			);
		} else if (error.code === '3D000') {
			console.log('\n💡 Database does not exist. Please create it:');
			console.log('npx sequelize-cli db:create');
		}
	} finally {
		await sequelize.close();
	}
}

testConnection();
