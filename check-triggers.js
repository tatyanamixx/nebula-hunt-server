const { Client } = require('pg');

async function checkTriggers() {
	const client = new Client({
		host: 'localhost',
		port: 5432,
		database: 'nebulahunt_dev',
		user: 'postgres',
		password: '09160130'
	});

	try {
		await client.connect();
		console.log('🔍 Checking for triggers on markettransactions table...');

		// Check for triggers
		const triggerResult = await client.query(`
			SELECT 
				tgname as trigger_name,
				tgenabled as enabled,
				tgtype as trigger_type,
				tgdeferrable as deferrable,
				tginitdeferred as initially_deferred
			FROM pg_trigger 
			WHERE tgrelid = 'markettransactions'::regclass;
		`);

		if (triggerResult.rows.length > 0) {
			console.log('📋 Triggers found:');
			triggerResult.rows.forEach(trigger => {
				console.log(`  - ${trigger.trigger_name}:`);
				console.log(`    Enabled: ${trigger.enabled}`);
				console.log(`    Type: ${trigger.trigger_type}`);
				console.log(`    Deferrable: ${trigger.deferrable}`);
				console.log(`    Initially deferred: ${trigger.initially_deferred}`);
			});
		} else {
			console.log('✅ No triggers found on markettransactions table');
		}

		// Check for rules
		const ruleResult = await client.query(`
			SELECT 
				rulename as rule_name,
				ev_type as event_type,
				ev_enabled as enabled
			FROM pg_rewrite 
			WHERE ev_class = 'markettransactions'::regclass;
		`);

		if (ruleResult.rows.length > 0) {
			console.log('\n📋 Rules found:');
			ruleResult.rows.forEach(rule => {
				console.log(`  - ${rule.rule_name}:`);
				console.log(`    Event type: ${rule.event_type}`);
				console.log(`    Enabled: ${rule.enabled}`);
			});
		} else {
			console.log('\n✅ No rules found on markettransactions table');
		}

		// Check if there are any active sessions that might be holding locks
		const sessionResult = await client.query(`
			SELECT 
				pid,
				usename,
				application_name,
				state,
				query
			FROM pg_stat_activity 
			WHERE datname = 'nebulahunt_dev'
			AND state = 'active';
		`);

		if (sessionResult.rows.length > 0) {
			console.log('\n📋 Active sessions:');
			sessionResult.rows.forEach(session => {
				console.log(`  - PID ${session.pid} (${session.usename}):`);
				console.log(`    Application: ${session.application_name}`);
				console.log(`    State: ${session.state}`);
				console.log(`    Query: ${session.query.substring(0, 100)}...`);
			});
		} else {
			console.log('\n✅ No active sessions found');
		}

	} catch (error) {
		console.error('❌ Error checking triggers:', error.message);
	} finally {
		await client.end();
	}
}

checkTriggers(); 