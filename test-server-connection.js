/**
 * Script to test server connection
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testServerConnection() {
	try {
		console.log('🔍 Testing server connection...');
		console.log('URL:', BASE_URL);

		// Тестируем базовое подключение
		const response = await axios.get(`${BASE_URL}/health`, {
			timeout: 5000,
		});

		console.log('✅ Server is running!');
		console.log('Status:', response.status);
		console.log('Response:', response.data);

		return true;
	} catch (error) {
		console.error('❌ Server connection failed:');

		if (error.code === 'ECONNREFUSED') {
			console.error('Server is not running on port 5000');
			console.log('💡 Start the server with: npm start');
		} else if (error.code === 'ENOTFOUND') {
			console.error('Cannot resolve localhost');
		} else if (error.code === 'ETIMEDOUT') {
			console.error(
				'Connection timeout - server might be slow to respond'
			);
		} else {
			console.error('Error:', error.message);
		}

		return false;
	}
}

async function testAdminEndpoints() {
	try {
		console.log('\n🔍 Testing admin endpoints...');

		// Тестируем endpoint валидации приглашения
		const response = await axios.get(
			`${BASE_URL}/api/admin/invite/validate?token=test-token`,
			{
				timeout: 5000,
			}
		);

		console.log('✅ Admin endpoints are accessible');
		console.log('Response status:', response.status);
	} catch (error) {
		console.log('📋 Admin endpoint test result:');

		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Response:', error.response.data);

			if (error.response.status === 400) {
				console.log(
					'✅ Endpoint is working (expected error for invalid token)'
				);
			}
		} else {
			console.log('❌ Endpoint test failed:', error.message);
		}
	}
}

async function runConnectionTests() {
	console.log('🧪 Starting server connection tests...\n');

	const serverRunning = await testServerConnection();

	if (serverRunning) {
		await testAdminEndpoints();
	}

	console.log('\n💡 Troubleshooting tips:');
	console.log('1. Make sure the server is running: npm start');
	console.log('2. Check if port 5000 is available');
	console.log('3. Verify the server started without errors');
	console.log('4. Check the server logs for any issues');
}

runConnectionTests();
