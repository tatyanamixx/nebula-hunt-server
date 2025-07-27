/**
 * Simple script to test email invitation sending
 */

// Load environment variables
require('./config/env-loader');

const nodemailer = require('nodemailer');

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

		// Create transporter
		let transporter;
		if (process.env.NODE_ENV === 'development') {
			transporter = nodemailer.createTransport({
				host: 'smtp.ethereal.email',
				port: 587,
				secure: false,
				auth: {
					user: process.env.ETHEREAL_USER || 'test@ethereal.email',
					pass: process.env.ETHEREAL_PASS || 'test123',
				},
			});
		} else {
			transporter = nodemailer.createTransport({
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT || 587,
				secure: process.env.SMTP_SECURE === 'true',
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
			});
		}

		// Generate email content
		const inviteUrl = `http://localhost:3000/admin/register?token=${testData.token}`;

		const mailOptions = {
			from: process.env.SMTP_FROM || 'noreply@nebulahunt.com',
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
