/**
 * Test script for password login with 2FA
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com'; // Replace with existing admin email
const TEST_PASSWORD = 'TestPass123!'; // Replace with actual password

async function testPassword2FA() {
	try {
		console.log('🧪 Testing password login with 2FA...\n');

		// Step 1: Try password login
		console.log('📧 Step 1: Attempting password login...');
		const loginResponse = await axios.post(
			`${BASE_URL}/api/admin/login/password`,
			{
				email: TEST_EMAIL,
				password: TEST_PASSWORD,
			}
		);

		console.log('✅ Login response:', loginResponse.data);

		if (loginResponse.data.requires2FA) {
			console.log('🔐 2FA required!');
			console.log('User data:', loginResponse.data.userData);

			// Step 2: Get QR code
			console.log('\n📱 Step 2: Getting QR code...');
			const qrResponse = await axios.get(
				`${BASE_URL}/api/admin/2fa/qr/${TEST_EMAIL}`
			);
			console.log('✅ QR code data:', qrResponse.data);

			console.log('\n💡 Next steps:');
			console.log('1. Open the web interface');
			console.log('2. Try logging in with email/password');
			console.log('3. You should see 2FA step');
			console.log('4. Scan QR code with Google Authenticator');
			console.log('5. Enter the 6-digit code');
		} else {
			console.log('❌ 2FA not required - this might indicate an issue');
		}
	} catch (error) {
		console.error('❌ Error:', error.response?.data || error.message);

		if (
			error.response?.status === 403 &&
			error.response?.data?.message?.includes('2FA not enabled')
		) {
			console.log('\n💡 This admin account does not have 2FA enabled');
			console.log('To enable 2FA:');
			console.log('1. Login to the web interface');
			console.log('2. Go to Admin Settings');
			console.log('3. Enable 2FA for this account');
		}
	}
}

// Run the test
testPassword2FA();
