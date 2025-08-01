const { sequelize } = require('./models/index.js');

async function checkArtifactTemplates() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Check if table exists and has data
		const tableQuery = `
            SELECT COUNT(*) as count
            FROM artifacttemplates;
        `;
		const tableResult = await sequelize.query(tableQuery, {
			type: sequelize.QueryTypes.SELECT,
		});
		console.log('\nArtifact templates count:', tableResult[0].count);

		if (tableResult[0].count > 0) {
			// Get sample data
			const dataQuery = `
                SELECT id, slug, name, description, rarity, image, effects, limited, "limitedCount"
                FROM artifacttemplates
                ORDER BY id
                LIMIT 5;
            `;
			const dataResult = await sequelize.query(dataQuery, {
				type: sequelize.QueryTypes.SELECT,
			});
			console.log('\nSample artifact templates:');
			dataResult.forEach((row, index) => {
				console.log(
					`${index + 1}. ID: ${row.id}, Slug: ${row.slug}, Name: ${
						row.name
					}`
				);
				console.log(
					`   Description: ${JSON.stringify(row.description)}`
				);
				console.log(`   Rarity: ${row.rarity}, Image: ${row.image}`);
				console.log(`   Effects: ${JSON.stringify(row.effects)}`);
				console.log(
					`   Limited: ${row.limited}, Count: ${row.limitedCount}`
				);
				console.log('');
			});
		}

		// Check table structure
		const structureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'artifacttemplates'
            ORDER BY ordinal_position;
        `;
		const structureResult = await sequelize.query(structureQuery, {
			type: sequelize.QueryTypes.SELECT,
		});
		console.log('\nTable structure:');
		structureResult.forEach((col) => {
			console.log(
				`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`
			);
		});
	} catch (error) {
		console.error('Error checking artifact templates:', error);
	} finally {
		await sequelize.close();
	}
}

checkArtifactTemplates();
