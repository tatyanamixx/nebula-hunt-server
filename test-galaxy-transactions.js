const { Sequelize } = require('sequelize');
const config = require('./config/database.js');
const userService = require('./service/user-service');

const sequelize = new Sequelize(config.development);

async function testGalaxyTransactions() {
	try {
		console.log('🧪 Testing Galaxy Creation and Transactions');
		console.log('='.repeat(50));

		// Step 1: Create test user
		const testUserId = BigInt(Date.now());
		const testUsername = `galaxy_test_${Date.now()}`;

		console.log(`📝 Test User ID: ${testUserId}`);

		// Create user with galaxy data
		const galaxyData = {
			name: 'Transaction Test Galaxy',
			description: 'A galaxy to test transactions',
			type: 'SPIRAL',
			size: 'LARGE',
			seed: `transaction_seed_${Date.now()}`,
			starMin: 200,
			starCurrent: 200,
			price: 1000,
			particleCount: 200,
			onParticleCountChange: true,
			galaxyProperties: {
				coordinates: { x: 300, y: 400, z: 500 },
				resources: {
					stardust: 2000,
					darkMatter: 1000,
					stars: 200,
				},
			},
		};

		console.log('🌌 Galaxy data prepared');

		// Step 2: Create user with galaxy
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

			// Step 3: Check user state
			console.log('\n💰 User State:');
			console.log(JSON.stringify(userResult.data.userState, null, 2));

			// Step 4: Check galaxies
			console.log('\n🌌 User Galaxies:');
			console.log(JSON.stringify(userResult.data.galaxies, null, 2));
		} catch (error) {
			console.error('❌ Error creating user with galaxy:');
			console.error('Message:', error.message);
			console.error('Stack:', error.stack);
		}

		// Step 5: Check database directly
		console.log('\n📊 Database Check:');

		// Check galaxies table
		const galaxiesCheck = await sequelize.query(
			`
      SELECT id, "userId", "starCurrent", "starMin", price, seed, "galaxyProperties"
      FROM galaxies 
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
    `,
			{ bind: [testUserId.toString()] }
		);

		console.log('\n🌌 Galaxies in database:');
		galaxiesCheck[0].forEach((galaxy, index) => {
			console.log(`  ${index + 1}. Galaxy ID: ${galaxy.id}`);
			console.log(`     User ID: ${galaxy.userId}`);
			console.log(`     Star Current: ${galaxy.starCurrent}`);
			console.log(`     Star Min: ${galaxy.starMin}`);
			console.log(`     Price: ${galaxy.price}`);
			console.log(`     Seed: ${galaxy.seed}`);
			console.log(
				`     Properties: ${JSON.stringify(galaxy.galaxyProperties)}`
			);
		});

		// Check userstates table
		const userStateCheck = await sequelize.query(
			`
      SELECT "userId", stardust, "darkMatter", stars, "tgStars", "tonToken"
      FROM userstates 
      WHERE "userId" = $1
    `,
			{ bind: [testUserId.toString()] }
		);

		console.log('\n💰 User State in database:');
		if (userStateCheck[0].length > 0) {
			const state = userStateCheck[0][0];
			console.log(`  User ID: ${state.userId}`);
			console.log(`  Stardust: ${state.stardust}`);
			console.log(`  Dark Matter: ${state.darkMatter}`);
			console.log(`  Stars: ${state.stars}`);
			console.log(`  TG Stars: ${state.tgStars}`);
			console.log(`  TON Token: ${state.tonToken}`);
		} else {
			console.log('  ❌ User state not found');
		}

		// Check market offers
		const marketOffersCheck = await sequelize.query(
			`
      SELECT id, "sellerId", "buyerId", price, currency, amount, "itemType", "itemId", status
      FROM "MarketOffers" 
      WHERE "sellerId" = $1 OR "buyerId" = $1
      ORDER BY "createdAt" DESC
    `,
			{ bind: [testUserId.toString()] }
		);

		console.log('\n🏪 Market Offers:');
		marketOffersCheck[0].forEach((offer, index) => {
			console.log(`  ${index + 1}. Offer ID: ${offer.id}`);
			console.log(`     Seller: ${offer.sellerId}`);
			console.log(`     Buyer: ${offer.buyerId}`);
			console.log(`     Price: ${offer.price} ${offer.currency}`);
			console.log(`     Amount: ${offer.amount}`);
			console.log(`     Item Type: ${offer.itemType}`);
			console.log(`     Item ID: ${offer.itemId}`);
			console.log(`     Status: ${offer.status}`);
		});

		// Check market transactions
		try {
			const marketTransactionsCheck = await sequelize.query(
				`
        SELECT mt.id, mt."buyerId", mt."sellerId", mt.status, mt."completedAt",
               mo.price, mo.currency, mo.amount, mo."itemType", mo."itemId"
        FROM "MarketTransactions" mt
        JOIN "MarketOffers" mo ON mt."offerId" = mo.id
        WHERE mt."buyerId" = $1 OR mt."sellerId" = $1
        ORDER BY mt."createdAt" DESC
      `,
				{ bind: [testUserId.toString()] }
			);

			console.log('\n💳 Market Transactions:');
			marketTransactionsCheck[0].forEach((tx, index) => {
				console.log(`  ${index + 1}. Transaction ID: ${tx.id}`);
				console.log(`     Buyer: ${tx.buyerId}`);
				console.log(`     Seller: ${tx.sellerId}`);
				console.log(`     Status: ${tx.status}`);
				console.log(`     Price: ${tx.price} ${tx.currency}`);
				console.log(`     Amount: ${tx.amount}`);
				console.log(`     Item Type: ${tx.itemType}`);
				console.log(`     Item ID: ${tx.itemId}`);
			});
		} catch (error) {
			console.log('\n💳 Market Transactions: Table may not exist');
		}

		console.log('\n🎉 Test completed!');
		process.exit(0);
	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error('Stack trace:', error.stack);
		process.exit(1);
	}
}

testGalaxyTransactions();
