/**
 * Get real invite token from database
 */

// Load environment variables
require('./config/env-loader');

const sequelize = require('./db');

async function getRealInviteToken() {
	try {
		console.log('🔍 Getting real invite token from database...\n');

		// Query for pending invites
		const [invites] = await sequelize.query(`
			SELECT id, email, name, role, token, "expiresAt", "createdAt", used
			FROM admininvites 
			WHERE used = false 
			ORDER BY "createdAt" DESC 
			LIMIT 5
		`);

		if (invites.length === 0) {
			console.log('❌ No pending invites found in database');
			console.log('\n💡 To create a test invite:');
			console.log('1. Login as admin in the web interface');
			console.log('2. Go to Admin Settings');
			console.log('3. Send an invite to test@example.com');
			console.log('4. Run this script again');
			return;
		}

		console.log('📊 Found invites:');
		console.log('='.repeat(80));

		invites.forEach((invite, index) => {
			console.log(`${index + 1}. Email: ${invite.email}`);
			console.log(`   Name: ${invite.name}`);
			console.log(`   Role: ${invite.role}`);
			console.log(`   Token: ${invite.token}`);
			console.log(`   Expires: ${invite.expiresAt}`);
			console.log(`   Created: ${invite.createdAt}`);
			console.log(`   Used: ${invite.used}`);
			console.log('');
		});

		// Get the latest invite
		const latestInvite = invites[0];

		console.log('🔗 Latest invite URL:');
		console.log('='.repeat(80));
		const inviteUrl = `http://localhost:3000/admin/register?token=${latestInvite.token}`;
		console.log(inviteUrl);
		console.log('='.repeat(80));

		console.log('\n📧 Email content for this invite:');
		console.log('='.repeat(60));
		console.log(`
Hello ${latestInvite.name},

You have been invited to join the Nebulahunt Admin Panel as a ${latestInvite.role}.

To accept this invitation, please visit the following link:
${inviteUrl}

Important:
- This invitation link will expire in 7 days
- Please complete your registration within this time
- If you did not expect this invitation, please ignore this email

If the link above doesn't work, you can copy and paste it into your browser.

This is an automated message from Nebulahunt Admin Panel.
Please do not reply to this email.
		`);
		console.log('='.repeat(60));

		console.log('\n🧪 Testing instructions:');
		console.log('1. Copy the invite URL above');
		console.log('2. Open it in your browser');
		console.log('3. Test the registration form');
		console.log('4. Complete the registration process');
		console.log('5. Verify the admin is created in database');
	} catch (error) {
		console.error('❌ Error getting invite token:', error.message);
	} finally {
		await sequelize.close();
	}
}

// Run the script
getRealInviteToken();
