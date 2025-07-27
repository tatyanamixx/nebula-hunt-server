/**
 * Script to preview email content without sending
 */

function generateEmailContent(email, name, role, token) {
	const inviteUrl = `http://localhost:3000/admin/register?token=${token}`;

	const htmlContent = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #333;">Welcome to Nebulahunt Admin Panel</h2>
			<p>Hello ${name},</p>
			<p>You have been invited to join the Nebulahunt Admin Panel as a <strong>${role}</strong>.</p>
			<p>To accept this invitation, please click the link below:</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${inviteUrl}" 
				   style="background-color: #007bff; color: white; padding: 12px 24px; 
				          text-decoration: none; border-radius: 5px; display: inline-block;">
					Accept Invitation
				</a>
			</div>
			<p><strong>Important:</strong></p>
			<ul>
				<li>This invitation link will expire in 7 days</li>
				<li>Please complete your registration within this time</li>
				<li>If you did not expect this invitation, please ignore this email</li>
			</ul>
			<p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
			<p style="word-break: break-all; color: #666;">${inviteUrl}</p>
			<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
			<p style="color: #666; font-size: 12px;">
				This is an automated message from Nebulahunt Admin Panel. 
				Please do not reply to this email.
			</p>
		</div>
	`;

	const textContent = `
Welcome to Nebulahunt Admin Panel

Hello ${name},

You have been invited to join the Nebulahunt Admin Panel as a ${role}.

To accept this invitation, please visit the following link:
${inviteUrl}

Important:
- This invitation link will expire in 7 days
- Please complete your registration within this time
- If you did not expect this invitation, please ignore this email

If the link above doesn't work, you can copy and paste it into your browser.

This is an automated message from Nebulahunt Admin Panel. 
Please do not reply to this email.
	`;

	return {
		html: htmlContent,
		text: textContent,
		subject: 'Invitation to join Nebulahunt Admin Panel',
		inviteUrl: inviteUrl,
	};
}

function previewEmail() {
	console.log('📧 Email Content Preview\n');

	// Test data
	const testData = {
		email: 'test@example.com',
		name: 'Test Admin',
		role: 'ADMIN',
		token: 'test-token-123456789',
	};

	const emailContent = generateEmailContent(
		testData.email,
		testData.name,
		testData.role,
		testData.token
	);

	console.log('📧 Email Details:');
	console.log('From:', process.env.SMTP_FROM || 'noreply@nebulahunt.com');
	console.log('To:', testData.email);
	console.log('Subject:', emailContent.subject);
	console.log('Invite URL:', emailContent.inviteUrl);

	console.log('\n📧 HTML Content:');
	console.log('='.repeat(50));
	console.log(emailContent.html);
	console.log('='.repeat(50));

	console.log('\n📧 Text Content:');
	console.log('='.repeat(50));
	console.log(emailContent.text);
	console.log('='.repeat(50));

	console.log('\n💡 To test the invite URL:');
	console.log('1. Copy the invite URL above');
	console.log('2. Open it in your browser');
	console.log('3. Test the registration form');

	console.log('\n🔧 To customize the email:');
	console.log('1. Edit the generateEmailContent function in this script');
	console.log('2. Or modify the email-service.js file');
}

// Run the preview
previewEmail();
