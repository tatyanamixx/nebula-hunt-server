/**
 * Script to fix invite status manually
 */

const sequelize = require('./db');

async function fixInviteStatus(email, adminId) {
	try {
		console.log(
			`🔧 Fixing invite status for email: ${email}, admin ID: ${adminId}`
		);

		// Обновляем приглашение
		const [updateResult] = await sequelize.query(
			`
			UPDATE admininvites 
			SET 
				used = true,
				"usedBy" = :adminId,
				"usedAt" = NOW(),
				"updatedAt" = NOW()
			WHERE email = :email 
			AND used = false
		`,
			{
				replacements: {
					email: email,
					adminId: adminId,
				},
			}
		);

		console.log('📊 Update result:', updateResult);

		if (updateResult.rowCount > 0) {
			console.log('✅ Invite status fixed successfully');
		} else {
			console.log('⚠️  No invites were updated');
		}

		// Проверяем результат
		const [results] = await sequelize.query(
			`
			SELECT 
				id,
				email,
				name,
				role,
				used,
				"usedAt",
				"usedBy",
				"expiresAt"
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

		if (results.length > 0) {
			const invite = results[0];
			console.log('\n📋 Updated invite:');
			console.log('Used:', invite.used);
			console.log('Used At:', invite.usedAt);
			console.log('Used By:', invite.usedBy);
		}
	} catch (error) {
		console.error('❌ Error fixing invite status:', error);
	} finally {
		await sequelize.close();
	}
}

// Получаем параметры из аргументов командной строки
const email = process.argv[2];
const adminId = process.argv[3];

if (!email || !adminId) {
	console.log('❌ Please provide email and admin ID as arguments');
	console.log('Usage: node fix-invite-status.js <email> <adminId>');
	console.log('Example: node fix-invite-status.js test@example.com 50');
	process.exit(1);
}

fixInviteStatus(email, adminId);
