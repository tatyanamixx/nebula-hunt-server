/**
 * Direct email test without logger dependencies
 */

// Load environment variables
require('./config/env-loader');

const nodemailer = require('nodemailer');

async function testEmailDirect() {
	try {
		console.log('🧪 Testing email invitation sending (direct)...\n');

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

		// Create transporter for development
		const transporter = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false,
			auth: {
				user: 'test@ethereal.email',
				pass: 'test123',
			},
		});

		// Generate email content
		const inviteUrl = `http://localhost:3000/admin/register?token=${testData.token}`;

		const mailOptions = {
			from: 'noreply@nebulahunt.com',
			to: testData.email,
			subject: 'Invitation to join Nebulahunt Admin Panel',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">Welcome to Nebulahunt Admin Panel</h2>
					<p>Hello ${testData.name},</p>
					<p>You have been invited to join the Nebulahunt Admin Panel as a <strong>${testData.role}</strong>.</p>
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
			`,
		};

		console.log('\n📧 Sending test email...');

		// Send test email
		const result = await transporter.sendMail(mailOptions);

		console.log('\n✅ Email sent successfully!');
		console.log('Message ID:', result.messageId);

		// Show invite URL
		console.log('\n🔗 Invite URL:');
		console.log(inviteUrl);

		console.log('\n💡 Next steps:');
		console.log('1. Copy the invite URL above');
		console.log('2. Open it in your browser');
		console.log('3. Test the registration form');
	} catch (error) {
		console.error('❌ Error sending test email:', error.message);

		// Show the invite URL anyway for testing
		const inviteUrl = `http://localhost:3000/admin/register?token=test-token-123456789`;
		console.log('\n🔗 Invite URL for testing:');
		console.log(inviteUrl);
		console.log(
			'\n💡 You can still test the registration form with this URL'
		);
	}
}

// Run the test
testEmailDirect();
