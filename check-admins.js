/**
 * Script to check admins in database
 */

const sequelize = require('./db');

async function checkAdmins() {
	try {
		console.log('🔍 Checking admins in database...');

		const results = await sequelize.query(
			`
			SELECT 
				id,
				email,
				name,
				role,
				"createdAt",
				"updatedAt"
			FROM admins 
			ORDER BY "createdAt" DESC
		`,
			{
				type: sequelize.QueryTypes.SELECT,
			}
		);

		console.log('📊 Admins in database:');
		console.table(results);

		if (results.length === 0) {
			console.log('❌ No admins found in database');
			console.log('💡 You need to create an admin first');
		} else {
			console.log('\n💡 Use one of these emails for testing:');
			results.forEach((admin) => {
				console.log(`- Email: ${admin.email}, Role: ${admin.role}`);
			});
		}
	} catch (error) {
		console.error('❌ Error checking admins:', error);
	} finally {
		await sequelize.close();
	}
}

checkAdmins();
