const axios = require('axios');

const testData = [
	{
		currency: 'tgstars',
		rate: 0.05,
		description: 'Fee 5% for tgStars',
	},
	{
		currency: 'tontoken',
		rate: 0.03,
		description: 'Fee 3% for tonToken',
	},
	{
		currency: 'stardust',
		rate: 0.02,
		description: 'Fee 2% for stardust',
	},
	{
		currency: 'darkmatter',
		rate: 0.02,
		description: 'Fee 2% for darkMatter',
	},
];

async function testCommissionAPI() {
	try {
		console.log('Testing Commission API...');
		console.log('Test data:', JSON.stringify(testData, null, 2));

		// Test POST request
		const response = await axios.post(
			'http://localhost:3000/api/commission-templates',
			testData,
			{
				headers: {
					'Content-Type': 'application/json',
					// Add any required headers for admin auth
				},
			}
		);

		console.log('Response status:', response.status);
		console.log('Response data:', JSON.stringify(response.data, null, 2));

		// Test GET request
		const getResponse = await axios.get(
			'http://localhost:3000/api/commission-templates',
			{
				headers: {
					// Add any required headers for admin auth
				},
			}
		);

		console.log('\nGET Response status:', getResponse.status);
		console.log(
			'GET Response data:',
			JSON.stringify(getResponse.data, null, 2)
		);
	} catch (error) {
		console.error('Error testing API:');
		if (error.response) {
			console.error('Status:', error.response.status);
			console.error('Data:', error.response.data);
		} else {
			console.error('Error:', error.message);
		}
	}
}

testCommissionAPI();
