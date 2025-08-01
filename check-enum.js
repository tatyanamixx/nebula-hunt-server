const { sequelize } = require('./models/index.js');

async function checkEnum() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Check current ENUM values
		const enumQuery = `
			SELECT 
				t.typname as enum_name,
				e.enumlabel as enum_value
			FROM pg_type t 
			JOIN pg_enum e ON t.oid = e.enumtypid  
			WHERE t.typname = 'enum_marketcommissions_currency'
			ORDER BY e.enumsortorder;
		`;

		const enumResult = await sequelize.query(enumQuery, {
			type: sequelize.QueryTypes.SELECT,
		});
		console.log('\nCurrent ENUM values for marketcommissions.currency:');
		if (enumResult.length === 0) {
			console.log('No ENUM type found');
		} else {
			enumResult.forEach((row) => {
				console.log(`- ${row.enum_value}`);
			});
		}

		// Check current data in the table
		const dataQuery = `
			SELECT currency, rate, description 
			FROM marketcommissions 
			ORDER BY currency;
		`;

		const dataResult = await sequelize.query(dataQuery, {
			type: sequelize.QueryTypes.SELECT,
		});
		console.log('\nCurrent data in marketcommissions table:');
		if (dataResult.length === 0) {
			console.log('No data found');
		} else {
			dataResult.forEach((row) => {
				console.log(
					`- currency: "${row.currency}", rate: ${row.rate}, description: "${row.description}"`
				);
			});
		}

		// Check table structure
		const tableQuery = `
			SELECT 
				column_name,
				data_type,
				udt_name,
				is_nullable,
				column_default
			FROM information_schema.columns 
			WHERE table_name = 'marketcommissions' 
			AND column_name = 'currency';
		`;

		const tableResult = await sequelize.query(tableQuery, {
			type: sequelize.QueryTypes.SELECT,
		});
		console.log('\nTable structure for currency column:');
		if (tableResult.length > 0) {
			const col = tableResult[0];
			console.log(`- column_name: ${col.column_name}`);
			console.log(`- data_type: ${col.data_type}`);
			console.log(`- udt_name: ${col.udt_name}`);
			console.log(`- is_nullable: ${col.is_nullable}`);
			console.log(`- column_default: ${col.column_default}`);
		}
	} catch (error) {
		console.error('Error checking ENUM:', error);
	} finally {
		await sequelize.close();
	}
}

checkEnum();
