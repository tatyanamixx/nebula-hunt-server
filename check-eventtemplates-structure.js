const { sequelize } = require('./models/models');

async function checkEventTemplatesStructure() {
	try {
		console.log('🔍 Checking eventtemplates table structure...\n');

		// Check table structure
		const [results] = await sequelize.query(`
			SELECT 
				column_name,
				data_type,
				is_nullable,
				column_default,
				character_maximum_length
			FROM information_schema.columns 
			WHERE table_name = 'eventtemplates' 
			ORDER BY ordinal_position;
		`);

		console.log('📋 Table structure:');
		results.forEach((col) => {
			console.log(
				`   ${col.column_name}: ${col.data_type} ${
					col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'
				} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`
			);
		});

		// Check primary key
		const [pkResults] = await sequelize.query(`
			SELECT 
				tc.constraint_name,
				tc.table_name,
				kcu.column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu 
				ON tc.constraint_name = kcu.constraint_name
			WHERE tc.constraint_type = 'PRIMARY KEY' 
				AND tc.table_name = 'eventtemplates';
		`);

		console.log('\n🔑 Primary key:');
		pkResults.forEach((pk) => {
			console.log(`   ${pk.constraint_name}: ${pk.column_name}`);
		});

		// Check sequences
		const [seqResults] = await sequelize.query(`
			SELECT 
				sequence_name,
				last_value,
				start_value,
				increment_by
			FROM information_schema.sequences 
			WHERE sequence_name LIKE '%eventtemplates%';
		`);

		console.log('\n🔢 Sequences:');
		if (seqResults.length > 0) {
			seqResults.forEach((seq) => {
				console.log(
					`   ${seq.sequence_name}: last_value=${seq.last_value}, start_value=${seq.start_value}, increment_by=${seq.increment_by}`
				);
			});
		} else {
			console.log('   No sequences found for eventtemplates');
		}

		// Check indexes
		const [idxResults] = await sequelize.query(`
			SELECT 
				indexname,
				indexdef
			FROM pg_indexes 
			WHERE tablename = 'eventtemplates';
		`);

		console.log('\n📊 Indexes:');
		idxResults.forEach((idx) => {
			console.log(`   ${idx.indexname}: ${idx.indexdef}`);
		});

		console.log('\n✅ Structure check completed!');
	} catch (error) {
		console.error('❌ Error checking structure:', error.message);
	} finally {
		await sequelize.close();
		process.exit(0);
	}
}

checkEventTemplatesStructure();
