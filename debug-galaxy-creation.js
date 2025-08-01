const { Sequelize } = require('sequelize');
const config = require('./config/database.js');
const userService = require('./service/user-service');

const sequelize = new Sequelize(config.development);

async function debugGalaxyCreation() {
	try {
		console.log('🔍 Debugging Galaxy Creation...');

		// Create test user
		const testUserId = BigInt(Date.now());
		const testUsername = `debug_test_${Date.now()}`;

		console.log(`📝 Test User ID: ${testUserId}`);

		// Create user with galaxy data
		const galaxyData = {
			name: 'Debug Test Galaxy',
			description: 'A galaxy for debugging',
			type: 'SPIRAL',
			size: 'MEDIUM',
			seed: `debug_seed_${Date.now()}`,
			starMin: 50,
			starCurrent: 50,
			price: 250,
			particleCount: 50,
			onParticleCountChange: true,
			galaxyProperties: {
				coordinates: { x: 50, y: 100, z: 150 },
				resources: {
					stardust: 500,
					darkMatter: 250,
					stars: 50,
				},
			},
		};

		console.log('🌌 Galaxy data prepared');

		// Try to create user with galaxy
		try {
			const userResult = await userService.login(
				testUserId,
				testUsername,
				null,
				galaxyData
			);
			console.log('✅ User created successfully');
			console.log(`📊 User ID: ${userResult.data.auth.user.id}`);
			console.log(
				`📊 Galaxy Created: ${userResult.data.metadata.galaxyCreated}`
			);

			// Check if galaxy was created
			const galaxyCheck = await sequelize.query(
				`
        SELECT id, "starCurrent", "userId"
        FROM galaxies 
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 1
      `,
				{ bind: [testUserId.toString()] }
			);

			if (galaxyCheck[0].length > 0) {
				console.log('✅ Galaxy found in database');
				console.log(`🌌 Galaxy ID: ${galaxyCheck[0][0].id}`);
				console.log(
					`🌌 Star Current: ${galaxyCheck[0][0].starCurrent}`
				);
			} else {
				console.log('❌ Galaxy not found in database');
			}
		} catch (error) {
			console.error('❌ Error creating user with galaxy:');
			console.error('Message:', error.message);
			console.error('Stack:', error.stack);
		}

		console.log('\n🎉 Debug completed!');
		process.exit(0);
	} catch (error) {
		console.error('❌ Debug failed:', error.message);
		console.error('Stack trace:', error.stack);
		process.exit(1);
	}
}

debugGalaxyCreation();
