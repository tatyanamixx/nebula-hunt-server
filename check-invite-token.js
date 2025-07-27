/**
 * Script to check invite token in database
 */

const sequelize = require('./db');

async function checkInviteToken(email) {
	try {
		console.log(`🔍 Checking invite token for email: ${email}`);

		const results = await sequelize.query(
			`
			SELECT 
				id,
				email,
				name,
				role,
				token,
				used,
				"usedAt",
				"usedBy",
				"expiresAt",
				"createdAt"
			FROM admininvites 
			WHERE email = :email
			ORDER BY "createdAt" DESC
			LIMIT 1
		`,
			{
				replacements: { email: email },
				type: sequelize.QueryTypes.SELECT,
			}
		);

		console.log('🔍 Query results:', results);
		console.log('🔍 Results type:', typeof results);
		console.log(
			'🔍 Results length:',
			results ? results.length : 'undefined'
		);

		if (!results || results.length === 0) {
			console.log('❌ No invites found for this email');
			return;
		}

		const invite = results[0];
		console.log('📊 Invite found:');
		console.log('ID:', invite.id);
		console.log('Email:', invite.email);
		console.log('Name:', invite.name);
		console.log('Role:', invite.role);
		console.log('Token:', invite.token);
		console.log('Used:', invite.used);
		console.log('Used At:', invite.usedAt);
		console.log('Used By:', invite.usedBy);
		console.log('Expires At:', invite.expiresAt);
		console.log('Created At:', invite.createdAt);

		// Проверяем статус
		const now = new Date();
		const expiresAt = new Date(invite.expiresAt);
		let status = 'PENDING';

		if (invite.used) {
			status = 'ACCEPTED';
		} else if (expiresAt < now) {
			status = 'EXPIRED';
		}

		console.log('\n🔍 Status check:');
		console.log('Current time:', now);
		console.log('Expires at:', expiresAt);
		console.log('Status:', status);
		console.log('Is expired:', expiresAt < now);
		console.log('Is used:', invite.used);

		// Формируем ссылку для регистрации
		const inviteUrl = `http://localhost:3000/admin/register?token=${invite.token}`;
		console.log('\n🔗 Invite URL:');
		console.log(inviteUrl);
	} catch (error) {
		console.error('❌ Error checking invite token:', error);
	} finally {
		await sequelize.close();
	}
}

// Получаем email из аргументов командной строки
const email = process.argv[2];
if (!email) {
	console.log('❌ Please provide email as argument');
	console.log('Usage: node check-invite-token.js <email>');
	console.log('Example: node check-invite-token.js test@example.com');
	process.exit(1);
}

checkInviteToken(email);
