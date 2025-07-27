/**
 * Script to check admin password
 */

const sequelize = require('./db');

async function checkAdminPassword(email) {
	try {
		console.log(`🔍 Checking admin password for email: ${email}`);

		const results = await sequelize.query(
			`
			SELECT 
				id,
				email,
				name,
				role,
				password,
				"createdAt"
			FROM admins 
			WHERE email = :email
		`,
			{
				replacements: { email: email },
				type: sequelize.QueryTypes.SELECT,
			}
		);

		if (results.length === 0) {
			console.log('❌ Admin not found');
			return;
		}

		const admin = results[0];
		console.log('📊 Admin found:');
		console.log('ID:', admin.id);
		console.log('Email:', admin.email);
		console.log('Name:', admin.name);
		console.log('Role:', admin.role);
		console.log('Has password:', !!admin.password);
		console.log(
			'Password length:',
			admin.password ? admin.password.length : 0
		);
		console.log('Created at:', admin.createdAt);

		if (!admin.password) {
			console.log('\n⚠️  This admin has no password set');
			console.log('💡 You need to set a password for this admin');
		} else {
			console.log('\n✅ Admin has password set');
		}
	} catch (error) {
		console.error('❌ Error checking admin password:', error);
	} finally {
		await sequelize.close();
	}
}

// Получаем email из аргументов командной строки
const email = process.argv[2];
if (!email) {
	console.log('❌ Please provide email as argument');
	console.log('Usage: node check-admin-password.js <email>');
	console.log('Example: node check-admin-password.js tatyanamixx@gmail.com');
	process.exit(1);
}

checkAdminPassword(email);
