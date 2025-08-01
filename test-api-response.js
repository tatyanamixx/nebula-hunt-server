const { sequelize } = require('./models/index.js');
const { UpgradeNodeTemplate } = require('./models/models.js');

async function testAPIResponse() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Get all templates like the API does
		const templates = await UpgradeNodeTemplate.findAll({
			order: [['slug', 'ASC']],
		});

		console.log('API Response format:');
		console.log('Type:', typeof templates);
		console.log('Is Array:', Array.isArray(templates));
		console.log('Length:', templates.length);
		console.log(
			'First template:',
			templates[0]
				? {
						id: templates[0].id,
						slug: templates[0].slug,
						name: templates[0].name,
						currency: templates[0].currency,
				  }
				: 'No templates'
		);

		// Simulate what the API returns
		console.log('\nSimulated API response:');
		console.log(JSON.stringify(templates, null, 2));
	} catch (error) {
		console.error('Error testing API response:', error);
	} finally {
		await sequelize.close();
	}
}

testAPIResponse();
