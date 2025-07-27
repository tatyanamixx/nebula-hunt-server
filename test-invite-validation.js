/**
 * Script to test invite token validation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const INVITE_TOKEN =
	'6d475a974a3cf70bed00cabc690198666169ba4d5fee0739d4ad448e9f7185a6';

async function testInviteValidation() {
	try {
		console.log('🔍 Testing invite token validation...');
		console.log('Token:', INVITE_TOKEN);

		const response = await axios.get(
			`${BASE_URL}/api/admin/invite/validate?token=${INVITE_TOKEN}`
		);

		console.log('✅ Invite validation successful:');
		console.log('Email:', response.data.email);
		console.log('Name:', response.data.name);
		console.log('Role:', response.data.role);
		console.log('Status:', response.data.status);

		return response.data;
	} catch (error) {
		console.error('❌ Invite validation failed:');
		console.error('Error:', error.response?.data || error.message);
		return null;
	}
}

async function testAdminRegistration() {
	try {
		console.log('\n🚀 Testing admin registration...');

		const registrationData = {
			email: 'test@example.com',
			password: 'TestPassword123!',
			name: 'Test Admin',
			inviteToken: INVITE_TOKEN,
		};

		console.log('Registration data:', {
			email: registrationData.email,
			name: registrationData.name,
			password: '***hidden***',
			inviteToken: registrationData.inviteToken.substring(0, 8) + '...',
		});

		const response = await axios.post(
			`${BASE_URL}/api/admin/register`,
			registrationData
		);

		console.log('✅ Admin registration successful:');
		console.log('Message:', response.data.message);
		console.log('Email:', response.data.email);
		console.log('ID:', response.data.id);
		console.log('2FA Secret:', response.data.google2faSecret);
		console.log('OTP Auth URL:', response.data.otpAuthUrl);

		return response.data;
	} catch (error) {
		console.error('❌ Admin registration failed:');
		console.error('Error:', error.response?.data || error.message);
		return null;
	}
}

async function runTests() {
	console.log('🧪 Starting invite validation and registration tests...\n');

	// 1. Тестируем валидацию токена
	const validationResult = await testInviteValidation();
	if (!validationResult) {
		console.log('❌ Cannot proceed without valid invite token');
		return;
	}

	// 2. Тестируем регистрацию админа
	const registrationResult = await testAdminRegistration();
	if (!registrationResult) {
		console.log('❌ Admin registration failed');
		return;
	}

	console.log('\n🎉 All tests completed successfully!');
	console.log('💡 Next steps:');
	console.log('1. Check the database for the new admin record');
	console.log('2. Verify the invite is marked as used');
	console.log('3. Test admin login with the new credentials');
}

runTests();
