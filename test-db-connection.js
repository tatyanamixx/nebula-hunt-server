const sequelize = require('./db');
const { User } = require('./models/models');

async function testConnection() {
	try {
		console.log('🔍 Testing database connection...');

		// Test connection
		await sequelize.authenticate();
		console.log('✅ Database connection successful');

		// Test User model
		console.log('🔍 Testing User model...');
		const userCount = await User.count();
		console.log(`✅ User count: ${userCount}`);

		// Test simple query
		console.log('🔍 Testing simple User query...');
		const users = await User.findAll({
			attributes: ['id', 'username'],
			limit: 5,
		});
		console.log(`✅ Found ${users.length} users`);

		process.exit(0);
	} catch (error) {
		console.error('❌ Database test failed:', error);
		process.exit(1);
	}
}

testConnection();
