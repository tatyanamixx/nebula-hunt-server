/**
 * Script to check invite status and related records
 */

const sequelize = require('./db');

async function checkInviteStatus(email) {
	try {
		console.log(`🔍 Checking invite status for email: ${email}`);

		// 1. Проверяем приглашения
		const invites = await sequelize.query(
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
		`,
			{
				replacements: { email: email },
				type: sequelize.QueryTypes.SELECT,
			}
		);

		console.log('\n📊 Invites found:', invites.length);
		if (invites.length > 0) {
			console.table(invites);
		}

		// 2. Проверяем админов
		const admins = await sequelize.query(
			`
			SELECT 
				id,
				email,
				name,
				role,
				"is_2fa_enabled",
				blocked,
				"createdAt"
			FROM admins 
			WHERE email = :email
			ORDER BY "createdAt" DESC
		`,
			{
				replacements: { email: email },
				type: sequelize.QueryTypes.SELECT,
			}
		);

		console.log('\n👤 Admins found:', admins.length);
		if (admins.length > 0) {
			console.table(admins);
		}

		// 3. Анализируем состояние
		console.log('\n🔍 Status Analysis:');

		if (invites.length === 0) {
			console.log('❌ No invites found for this email');
			return;
		}

		const latestInvite = invites[0];
		const admin = admins.length > 0 ? admins[0] : null;

		console.log('Latest invite:');
		console.log('- Status:', latestInvite.used ? 'ACCEPTED' : 'PENDING');
		console.log('- Used:', latestInvite.used);
		console.log('- Used At:', latestInvite.usedAt);
		console.log('- Used By:', latestInvite.usedBy);
		console.log('- Expires At:', latestInvite.expiresAt);
		console.log(
			'- Is Expired:',
			new Date(latestInvite.expiresAt) < new Date()
		);

		if (admin) {
			console.log('\nAdmin record:');
			console.log('- ID:', admin.id);
			console.log('- Role:', admin.role);
			console.log('- 2FA Enabled:', admin.is_2fa_enabled);
			console.log('- Blocked:', admin.blocked);
			console.log('- Created At:', admin.createdAt);
		} else {
			console.log(
				'\n❌ No admin record found - registration not completed'
			);
		}

		// 4. Проверяем соответствие
		if (latestInvite.used && admin) {
			console.log('\n✅ Invite and admin records match');
			console.log('✅ Registration completed successfully');
		} else if (latestInvite.used && !admin) {
			console.log(
				'\n⚠️  Invite marked as used but no admin record found'
			);
			console.log(
				'⚠️  This might indicate an error in the registration process'
			);
		} else if (!latestInvite.used && admin) {
			console.log(
				'\n⚠️  Admin record exists but invite not marked as used'
			);
			console.log(
				'⚠️  This might indicate an error in the invite update process'
			);
		} else {
			console.log('\n⏳ Invite is pending - waiting for registration');
		}
	} catch (error) {
		console.error('❌ Error checking invite status:', error);
	} finally {
		await sequelize.close();
	}
}

// Получаем email из аргументов командной строки
const email = process.argv[2];
if (!email) {
	console.log('❌ Please provide email as argument');
	console.log('Usage: node check-invite-status.js <email>');
	console.log('Example: node check-invite-status.js test@example.com');
	process.exit(1);
}

checkInviteStatus(email);
