/**
 * Script to test email invitation sending
 */

// Load environment variables first
require('./config/env-loader');

const emailService = require('./service/email-service');

async function testEmailInvite() {
	try {
		console.log('🧪 Testing email invitation sending...\n');

		// Test data
		const testData = {
			email: 'test@example.com',
			name: 'Test Admin',
			role: 'ADMIN',
			token: 'test-token-123456789',
		};

		console.log('📧 Test data:');
		console.log('- Email:', testData.email);
		console.log('- Name:', testData.name);
		console.log('- Role:', testData.role);
		console.log('- Token:', testData.token);

		console.log('\n📧 Sending test email...');

		// Send test email
		const result = await emailService.sendAdminInvite(
			testData.email,
			testData.name,
			testData.role,
			testData.token
		);

		console.log('\n✅ Email sent successfully!');
		console.log('Message ID:', result.messageId);

		// Show invite URL
		const inviteUrl = `http://localhost:3000/admin/register?token=${testData.token}`;
		console.log('\n🔗 Invite URL:');
		console.log(inviteUrl);

		console.log('\n💡 Next steps:');
		console.log('1. Check your email (if using real SMTP)');
		console.log('2. Or check console output above (in development mode)');
		console.log('3. Click the invite URL to test registration');
	} catch (error) {
		console.error('❌ Error sending test email:', error.message);

		if (process.env.NODE_ENV === 'development') {
			console.log(
				'\n💡 In development mode, check the console output above for the invite URL'
			);
		}
	}
}

// Run the test
testEmailInvite();
