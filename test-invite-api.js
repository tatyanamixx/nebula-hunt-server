/**
 * Script to test invite API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'tatyanamixx@gmail.com'; // Реальный email админа из базы
const ADMIN_PASSWORD = 'your_password_here'; // Замените на реальный пароль админа

let adminToken = null;

async function loginAdmin() {
	try {
		console.log('🔐 Logging in as admin...');
		const response = await axios.post(`${BASE_URL}/admin/login/password`, {
			email: ADMIN_EMAIL,
			password: ADMIN_PASSWORD,
		});

		adminToken = response.data.accessToken;
		console.log('✅ Admin logged in successfully');
		return true;
	} catch (error) {
		console.error(
			'❌ Admin login failed:',
			error.response?.data || error.message
		);
		return false;
	}
}

async function sendInvite() {
	try {
		console.log('\n📧 Sending invite...');
		const response = await axios.post(
			`${BASE_URL}/admin/invite`,
			{
				email: 'test@example.com',
				name: 'Test Admin',
				role: 'ADMIN',
			},
			{
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			}
		);

		console.log('✅ Invite sent successfully:', response.data);
		return true;
	} catch (error) {
		console.error(
			'❌ Send invite failed:',
			error.response?.data || error.message
		);
		return false;
	}
}

async function getInvites() {
	try {
		console.log('\n📋 Getting invites list...');
		const response = await axios.get(`${BASE_URL}/admin/invites`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		console.log('✅ Invites list:');
		console.table(response.data);
		return response.data;
	} catch (error) {
		console.error(
			'❌ Get invites failed:',
			error.response?.data || error.message
		);
		return null;
	}
}

async function validateInvite(token) {
	try {
		console.log('\n🔍 Validating invite token...');
		const response = await axios.post(`${BASE_URL}/admin/validate-invite`, {
			token: token,
		});

		console.log('✅ Invite validation result:', response.data);
		return response.data;
	} catch (error) {
		console.error(
			'❌ Validate invite failed:',
			error.response?.data || error.message
		);
		return null;
	}
}

async function testInviteFlow() {
	console.log('🚀 Starting invite API test...\n');

	// 1. Логин админа
	const loginSuccess = await loginAdmin();
	if (!loginSuccess) {
		console.log('❌ Cannot proceed without admin login');
		return;
	}

	// 2. Отправка приглашения
	const inviteSent = await sendInvite();
	if (!inviteSent) {
		console.log('❌ Cannot proceed without sending invite');
		return;
	}

	// 3. Получение списка приглашений
	const invites = await getInvites();
	if (!invites || invites.length === 0) {
		console.log('❌ No invites found');
		return;
	}

	// 4. Валидация токена приглашения
	const latestInvite = invites[0]; // Самый новый
	console.log('\n🔍 Latest invite:', {
		id: latestInvite.id,
		email: latestInvite.email,
		status: latestInvite.status,
		expiresAt: latestInvite.expiresAt,
	});

	// Получаем токен из базы данных (нужно будет запустить check-invite-token.js)
	console.log('\n💡 To validate invite token, run:');
	console.log(`node check-invite-token.js ${latestInvite.email}`);

	console.log('\n✅ Invite API test completed!');
}

// Запускаем тест
testInviteFlow().catch(console.error);
