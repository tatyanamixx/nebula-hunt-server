const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testInvitesAPI() {
	console.log('🧪 Testing Invites API...\n');

	try {
		// 1. Test server connection
		console.log('1️⃣ Testing server connection...');
		const healthResponse = await axios.get(`${BASE_URL}/health`);
		console.log('✅ Server is running:', healthResponse.data);

		// 2. Test admin login (you'll need to update these credentials)
		console.log('\n2️⃣ Testing admin login...');
		const loginResponse = await axios.post(
			`${BASE_URL}/api/admin/login/password`,
			{
				email: 'test@example.com', // Update with your admin email
				password: 'test123', // Update with your admin password
			}
		);
		console.log('✅ Login successful');

		const { accessToken } = loginResponse.data;
		const headers = { Authorization: `Bearer ${accessToken}` };

		// 3. Test getting invites
		console.log('\n3️⃣ Testing get invites...');
		const invitesResponse = await axios.get(
			`${BASE_URL}/api/admin/invites`,
			{ headers }
		);
		console.log(
			'✅ Invites response:',
			JSON.stringify(invitesResponse.data, null, 2)
		);

		// 4. Test sending invite
		console.log('\n4️⃣ Testing send invite...');
		const sendInviteResponse = await axios.post(
			`${BASE_URL}/api/admin/invite`,
			{
				email: 'test-invite@example.com',
				name: 'Test Invite User',
				role: 'ADMIN',
			},
			{ headers }
		);
		console.log(
			'✅ Send invite response:',
			JSON.stringify(sendInviteResponse.data, null, 2)
		);

		// 5. Test getting invites again
		console.log('\n5️⃣ Testing get invites after sending...');
		const invitesResponse2 = await axios.get(
			`${BASE_URL}/api/admin/invites`,
			{ headers }
		);
		console.log(
			'✅ Updated invites response:',
			JSON.stringify(invitesResponse2.data, null, 2)
		);
	} catch (error) {
		console.error('❌ Error:', error.response?.data || error.message);
		console.error('❌ Status:', error.response?.status);
		console.error('❌ Headers:', error.response?.headers);
	}
}

testInvitesAPI();
