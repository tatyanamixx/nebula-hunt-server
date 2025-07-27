/**
 * Script to test full invitation flow including email sending
 */

// Load environment variables first
require('./config/env-loader');

const axios = require('axios');
const emailService = require('./service/email-service');

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'tatyanamixx@gmail.com'; // Replace with your admin email
const ADMIN_PASSWORD = 'your_password_here'; // Replace with your admin password

let adminToken = null;

async function loginAdmin() {
	try {
		console.log('🔐 Logging in as admin...');
		const response = await axios.post(
			`${BASE_URL}/api/admin/login/password`,
			{
				email: ADMIN_EMAIL,
				password: ADMIN_PASSWORD,
			}
		);

		adminToken = response.data.accessToken;
		console.log('✅ Admin login successful');
		return true;
	} catch (error) {
		console.error(
			'❌ Admin login failed:',
			error.response?.data?.message || error.message
		);
		return false;
	}
}

async function sendInvite() {
	try {
		console.log('\n📧 Sending invite...');
		const response = await axios.post(
			`${BASE_URL}/api/admin/invite`,
			{
				email: 'newadmin@example.com',
				name: 'New Test Admin',
				role: 'ADMIN',
			},
			{
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			}
		);

		console.log('✅ Invite sent successfully');
		console.log('Invite data:', response.data);
		return response.data;
	} catch (error) {
		console.error(
			'❌ Failed to send invite:',
			error.response?.data?.message || error.message
		);
		return null;
	}
}

async function testEmailSending(inviteData) {
	try {
		console.log('\n📧 Testing email sending...');

		// Extract token from invite data
		const token = inviteData.token;

		// Send test email
		const result = await emailService.sendAdminInvite(
			'newadmin@example.com',
			'New Test Admin',
			'ADMIN',
			token
		);

		console.log('✅ Email sent successfully!');
		console.log('Message ID:', result.messageId);

		// Show invite URL
		const inviteUrl = `http://localhost:3000/admin/register?token=${token}`;
		console.log('\n🔗 Invite URL:');
		console.log(inviteUrl);

		return inviteUrl;
	} catch (error) {
		console.error('❌ Email sending failed:', error.message);
		return null;
	}
}

async function testInviteValidation(token) {
	try {
		console.log('\n🔍 Testing invite validation...');
		const response = await axios.get(
			`${BASE_URL}/api/admin/invite/validate?token=${token}`
		);

		console.log('✅ Invite validation successful');
		console.log('Validation data:', response.data);
		return response.data;
	} catch (error) {
		console.error(
			'❌ Invite validation failed:',
			error.response?.data?.message || error.message
		);
		return null;
	}
}

async function testFullFlow() {
	console.log('🧪 Testing full invitation flow...\n');

	// Step 1: Login as admin
	const loginSuccess = await loginAdmin();
	if (!loginSuccess) {
		console.log('❌ Cannot proceed without admin login');
		return;
	}

	// Step 2: Send invite
	const inviteData = await sendInvite();
	if (!inviteData) {
		console.log('❌ Cannot proceed without invite data');
		return;
	}

	// Step 3: Test email sending
	const inviteUrl = await testEmailSending(inviteData);
	if (!inviteUrl) {
		console.log('❌ Email sending failed');
		return;
	}

	// Step 4: Test invite validation
	const validationData = await testInviteValidation(inviteData.token);
	if (!validationData) {
		console.log('❌ Invite validation failed');
		return;
	}

	console.log('\n🎉 Full invitation flow test completed successfully!');
	console.log('\n📋 Summary:');
	console.log('- Admin login: ✅');
	console.log('- Invite creation: ✅');
	console.log('- Email sending: ✅');
	console.log('- Invite validation: ✅');

	console.log('\n🔗 Next steps:');
	console.log('1. Check the invite URL above');
	console.log('2. Open the URL in browser to test registration form');
	console.log('3. Complete the registration process');
	console.log('4. Verify the admin is created in database');
}

// Run the test
testFullFlow().catch(console.error);
