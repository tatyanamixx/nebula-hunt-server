/**
 * Email preview only - no sending attempt
 */

function generateEmailPreview() {
	console.log('📧 Email Invitation Preview\n');

	// Test data
	const testData = {
		email: 'test@example.com',
		name: 'Test Admin',
		role: 'ADMIN',
		token: 'test-token-123456789',
	};

	// Generate invite URL
	const inviteUrl = `http://localhost:3000/admin/register?token=${testData.token}`;

	console.log('📧 Email Details:');
	console.log('From: noreply@nebulahunt.com');
	console.log('To:', testData.email);
	console.log('Subject: Invitation to join Nebulahunt Admin Panel');
	console.log('Invite URL:', inviteUrl);

	console.log('\n📧 Email Content:');
	console.log('='.repeat(60));
	console.log(`
Hello ${testData.name},

You have been invited to join the Nebulahunt Admin Panel as a ${testData.role}.

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

	console.log('\n🔗 Test the registration form:');
	console.log('1. Copy this URL:', inviteUrl);
	console.log('2. Open it in your browser');
	console.log('3. Test the registration process');

	console.log('\n📋 What to test:');
	console.log('✅ Form loads with token pre-filled');
	console.log('✅ Can enter name and password');
	console.log('✅ Password visibility toggle works');
	console.log('✅ Form submission creates admin');
	console.log('✅ 2FA setup is triggered');
	console.log('✅ Invite is marked as used');

	console.log(
		'\n💡 Note: This is a test token. For real testing, use a token from the database.'
	);
}

// Run the preview
generateEmailPreview();
