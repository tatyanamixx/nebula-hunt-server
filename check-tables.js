const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
	username: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || 'postgres',
	database: process.env.DB_NAME || 'nebulahunt',
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 5432,
	dialect: 'postgres',
	logging: false,
});

async function checkTables() {
	try {
		await sequelize.authenticate();
		console.log('✅ Database connection successful!');

		// Get all tables
		const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

		console.log('\n📋 Tables in database:');
		if (results.length === 0) {
			console.log('No tables found in the database.');
		} else {
			results.forEach((row, index) => {
				console.log(`${index + 1}. ${row.table_name}`);
			});
		}

		// Check SequelizeMeta table
		const [migrations] = await sequelize.query(`
      SELECT name 
      FROM "SequelizeMeta" 
      ORDER BY name;
    `);

		console.log('\n🔄 Executed migrations:');
		if (migrations.length === 0) {
			console.log('No migrations found.');
		} else {
			migrations.forEach((migration, index) => {
				console.log(`${index + 1}. ${migration.name}`);
			});
		}
	} catch (error) {
		console.error('❌ Error:', error.message);
	} finally {
		await sequelize.close();
	}
}

checkTables();
