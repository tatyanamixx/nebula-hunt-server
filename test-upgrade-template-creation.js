const { sequelize } = require('./models/index.js');
const { UpgradeNodeTemplate } = require('./models/models.js');

async function testUpgradeTemplateCreation() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Test creating a single upgrade template
		const testTemplate = {
			slug: 'test-production-boost',
			name: 'Test Production Boost',
			description: {
				en: 'Increases production rate',
				ru: 'Увеличивает скорость производства',
			},
			maxLevel: 5,
			basePrice: 100,
			effectPerLevel: 0.1,
			priceMultiplier: 1.5,
			currency: 'stardust',
			category: 'production',
			icon: '⚡',
			stability: 0.8,
			instability: 0.1,
			active: true,
		};

		console.log('Creating test upgrade template...');
		const createdTemplate = await UpgradeNodeTemplate.create(testTemplate);
		console.log('Successfully created template:', {
			id: createdTemplate.id,
			slug: createdTemplate.slug,
			name: createdTemplate.name,
		});

		// Test creating multiple templates
		const multipleTemplates = [
			{
				slug: 'test-economy-boost',
				name: 'Test Economy Boost',
				description: {
					en: 'Increases economy efficiency',
					ru: 'Увеличивает эффективность экономики',
				},
				maxLevel: 3,
				basePrice: 50,
				effectPerLevel: 0.05,
				priceMultiplier: 1.2,
				currency: 'stardust',
				category: 'economy',
				icon: '💰',
				stability: 0.9,
				instability: 0.05,
				active: true,
			},
			{
				slug: 'test-storage-boost',
				name: 'Test Storage Boost',
				description: {
					en: 'Increases storage capacity',
					ru: 'Увеличивает вместимость хранилища',
				},
				maxLevel: 4,
				basePrice: 75,
				effectPerLevel: 0.08,
				priceMultiplier: 1.3,
				currency: 'darkmatter',
				category: 'storage',
				icon: '📦',
				stability: 0.85,
				instability: 0.08,
				active: true,
			},
		];

		console.log('\nCreating multiple upgrade templates...');
		const createdTemplates = await UpgradeNodeTemplate.bulkCreate(
			multipleTemplates
		);
		console.log(
			`Successfully created ${createdTemplates.length} templates`
		);

		// Clean up - delete test templates
		console.log('\nCleaning up test templates...');
		await UpgradeNodeTemplate.destroy({
			where: {
				slug: {
					$like: 'test-%',
				},
			},
		});
		console.log('Test templates cleaned up');

		console.log(
			'\n✅ All tests passed! Upgrade template creation is working correctly.'
		);
	} catch (error) {
		console.error('❌ Error testing upgrade template creation:', error);
	} finally {
		await sequelize.close();
	}
}

testUpgradeTemplateCreation();
