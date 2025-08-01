const { sequelize } = require('./models/index.js');
const { UpgradeNodeTemplate } = require('./models/models.js');

async function testUpgradeTemplateAPI() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Test creating a template
		const testTemplate = {
			slug: 'api-test-boost',
			name: 'API Test Boost',
			description: {
				en: 'Test upgrade for API',
				ru: 'Тестовое улучшение для API',
			},
			maxLevel: 3,
			basePrice: 50,
			effectPerLevel: 0.1,
			priceMultiplier: 1.2,
			currency: 'stardust',
			category: 'production',
			icon: '⚡',
			stability: 0.8,
			instability: 0.1,
			active: true,
		};

		console.log('Creating test template...');
		const createdTemplate = await UpgradeNodeTemplate.create(testTemplate);
		console.log('Created template:', {
			id: createdTemplate.id,
			slug: createdTemplate.slug,
			name: createdTemplate.name,
			currency: createdTemplate.currency,
		});

		// Test fetching all templates
		console.log('\nFetching all templates...');
		const allTemplates = await UpgradeNodeTemplate.findAll({
			where: { active: true },
			order: [['createdAt', 'DESC']],
		});
		console.log(`Found ${allTemplates.length} templates:`);
		allTemplates.forEach((template) => {
			console.log(
				`- ${template.name} (${template.slug}) - ${template.currency}`
			);
		});

		// Test fetching by slug
		console.log('\nFetching template by slug...');
		const templateBySlug = await UpgradeNodeTemplate.findOne({
			where: { slug: 'api-test-boost' },
		});
		if (templateBySlug) {
			console.log('Found template by slug:', {
				id: templateBySlug.id,
				slug: templateBySlug.slug,
				name: templateBySlug.name,
				currency: templateBySlug.currency,
			});
		} else {
			console.log('Template not found by slug');
		}

		// Clean up
		console.log('\nCleaning up...');
		await UpgradeNodeTemplate.destroy({
			where: { slug: 'api-test-boost' },
		});
		console.log('Test template cleaned up');

		console.log('\n✅ API test completed successfully!');
	} catch (error) {
		console.error('❌ Error testing API:', error);
	} finally {
		await sequelize.close();
	}
}

testUpgradeTemplateAPI();
