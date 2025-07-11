const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Database connection
const sequelize = new Sequelize({
	dialect: 'postgres',
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 5432,
	username: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || 'postgres',
	database: process.env.DB_NAME || 'nebulahunt',
	logging: console.log,
});

async function runMigrations() {
	try {
		console.log('Connecting to database...');
		await sequelize.authenticate();
		console.log('Database connection established successfully.');

		// Get all migration files
		const migrationsPath = path.join(__dirname, 'migrations');
		const migrationFiles = fs
			.readdirSync(migrationsPath)
			.filter((file) => file.endsWith('.js'))
			.sort();

		console.log(`Found ${migrationFiles.length} migration files:`);
		migrationFiles.forEach((file) => console.log(`  - ${file}`));

		// Create SequelizeMeta table if it doesn't exist
		await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

		// Get executed migrations
		const [executedMigrations] = await sequelize.query(
			'SELECT "name" FROM "SequelizeMeta" ORDER BY "name"'
		);
		const executedMigrationNames = executedMigrations.map(
			(row) => row.name
		);

		console.log('\nExecuted migrations:', executedMigrationNames);

		// Run pending migrations
		for (const migrationFile of migrationFiles) {
			if (!executedMigrationNames.includes(migrationFile)) {
				console.log(`\nRunning migration: ${migrationFile}`);

				const migration = require(path.join(
					migrationsPath,
					migrationFile
				));

				try {
					await migration.up(
						sequelize.getQueryInterface(),
						Sequelize
					);

					// Mark migration as executed
					await sequelize.query(
						'INSERT INTO "SequelizeMeta" ("name") VALUES (?)',
						{
							replacements: [migrationFile],
						}
					);

					console.log(
						`✓ Migration ${migrationFile} completed successfully`
					);
				} catch (error) {
					console.error(
						`✗ Migration ${migrationFile} failed:`,
						error.message
					);
					throw error;
				}
			} else {
				console.log(`- Migration ${migrationFile} already executed`);
			}
		}

		console.log('\n🎉 All migrations completed successfully!');
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

runMigrations();
