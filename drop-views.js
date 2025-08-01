const { sequelize } = require('./models/index.js');

async function dropViews() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Drop views that depend on tables
		await sequelize.query(
			'DROP VIEW IF EXISTS user_packages_with_template CASCADE;'
		);
		console.log('Dropped user_packages_with_template view');

		await sequelize.query(
			'DROP VIEW IF EXISTS user_upgrades_with_template CASCADE;'
		);
		console.log('Dropped user_upgrades_with_template view');

		await sequelize.query(
			'DROP VIEW IF EXISTS user_artifacts_with_template CASCADE;'
		);
		console.log('Dropped user_artifacts_with_template view');

		await sequelize.query(
			'DROP VIEW IF EXISTS user_tasks_with_template CASCADE;'
		);
		console.log('Dropped user_tasks_with_template view');

		await sequelize.query(
			'DROP VIEW IF EXISTS user_events_with_template CASCADE;'
		);
		console.log('Dropped user_events_with_template view');

		console.log('All views dropped successfully');
	} catch (error) {
		console.error('Error dropping views:', error);
	} finally {
		await sequelize.close();
	}
}

dropViews();
