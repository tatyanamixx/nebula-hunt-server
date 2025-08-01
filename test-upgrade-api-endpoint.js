const axios = require('axios');

async function testUpgradeAPIEndpoint() {
	try {
		console.log('Testing upgrade templates API endpoint...');

		// Test GET /api/upgrade-templates
		const response = await axios.get(
			'http://localhost:3001/api/upgrade-templates'
		);

		console.log('API Response Status:', response.status);
		console.log(
			'API Response Data:',
			JSON.stringify(response.data, null, 2)
		);

		if (response.data && response.data.templates) {
			console.log(
				`\nFound ${response.data.templates.length} templates via API:`
			);
			response.data.templates.forEach((template, index) => {
				console.log(
					`${index + 1}. ${template.name} (${template.slug}) - ${
						template.currency
					}`
				);
			});
		} else {
			console.log('No templates found in API response');
		}
	} catch (error) {
		console.error(
			'Error testing API endpoint:',
			error.response?.data || error.message
		);

		if (error.response) {
			console.log('Response status:', error.response.status);
			console.log('Response headers:', error.response.headers);
		}
	}
}

testUpgradeAPIEndpoint();
