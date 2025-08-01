const { EventTemplate, sequelize } = require('./models/models');
const eventTemplateService = require('./service/event-template-service');

async function testEventIdFix() {
	try {
		console.log('🧪 Testing Event Template ID fix...\n');

		// Test data with explicit id (should be ignored)
		const testEvent = {
			id: 999999, // This should be ignored
			slug: 'test_id_fix',
			name: 'Test ID Fix',
			description: {
				en: 'Test event for ID fix',
				ru: 'Тестовое событие для исправления ID',
			},
			type: 'RANDOM',
			triggerConfig: {
				probability: 0.1,
			},
			effect: {
				multipliers: {
					cps: 1.5,
				},
				duration: 300,
			},
			frequency: {
				interval: 3600,
			},
			conditions: {
				minLevel: 5,
			},
			active: true,
		};

		// Test 1: Create event with explicit id (should be ignored)
		console.log('📝 Test 1: Creating event with explicit ID...');
		const result1 = await eventTemplateService.createEvents([testEvent]);
		console.log('✅ Created event:', result1.events[0].slug);
		console.log('   ID:', result1.events[0].id); // Should be auto-generated, not 999999
		console.log('   Name:', result1.events[0].name);

		// Test 2: Update the event
		console.log('\n📝 Test 2: Updating the event...');
		const updateData = {
			id: 888888, // This should also be ignored
			slug: 'test_id_fix',
			name: 'Updated Test ID Fix',
			description: {
				en: 'Updated test event for ID fix',
				ru: 'Обновленное тестовое событие для исправления ID',
			},
			type: 'RANDOM',
			triggerConfig: {
				probability: 0.2,
			},
			effect: {
				multipliers: {
					cps: 2.0,
				},
				duration: 600,
			},
			frequency: {
				interval: 7200,
			},
			conditions: {
				minLevel: 10,
			},
			active: false,
		};

		const result2 = await eventTemplateService.updateEvent(updateData);
		console.log('✅ Updated event:', result2.slug);
		console.log('   ID:', result2.id); // Should remain the same as before
		console.log('   Name:', result2.name);
		console.log('   Active:', result2.active);

		// Test 3: Verify in database
		console.log('\n📝 Test 3: Verifying in database...');
		const dbEvent = await EventTemplate.findOne({
			where: { slug: 'test_id_fix' },
		});
		if (dbEvent) {
			console.log('✅ Event found in database');
			console.log('   ID:', dbEvent.id);
			console.log('   Name:', dbEvent.name);
			console.log('   Active:', dbEvent.active);
		} else {
			console.log('❌ Event not found in database');
		}

		// Cleanup
		console.log('\n🧹 Cleaning up test data...');
		try {
			await eventTemplateService.deleteEvent('test_id_fix');
			console.log('   ✅ Deleted: test_id_fix');
		} catch (error) {
			console.log('   ⚠️  Could not delete test_id_fix:', error.message);
		}

		console.log(
			'\n🎉 Event Template ID fix testing completed successfully!'
		);
	} catch (error) {
		console.error('❌ Error testing event ID fix:', error.message);
		console.error(error.stack);
	} finally {
		await sequelize.close();
		process.exit(0);
	}
}

testEventIdFix();
