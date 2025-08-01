const { EventTemplate, sequelize } = require('./models/models');
const eventTemplateService = require('./service/event-template-service');

async function testEventFindOrCreate() {
	try {
		console.log(
			'🧪 Testing Event Template findOrCreate functionality...\n'
		);

		// Test data
		const testEvent = {
			slug: 'test_find_or_create',
			name: 'Test Find Or Create',
			description: {
				en: 'Test event for findOrCreate',
				ru: 'Тестовое событие для findOrCreate',
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

		// Test 1: Create new event using findOrCreate
		console.log('📝 Test 1: Creating new event using findOrCreate...');
		const result1 = await eventTemplateService.createEvents([testEvent]);
		console.log('✅ Created event:', result1.events[0].slug);
		console.log('   Created:', result1.events[0].createdAt);
		console.log('   Updated:', result1.events[0].updatedAt);
		console.log('   Type:', typeof result1.events[0]); // Should be 'object' (JSON)

		// Test 2: Try to create the same event again (should update existing)
		console.log('\n📝 Test 2: Trying to create the same event again...');
		const updatedEvent = {
			...testEvent,
			name: 'Updated Test Find Or Create',
			description: {
				en: 'Updated test event for findOrCreate',
				ru: 'Обновленное тестовое событие для findOrCreate',
			},
		};
		const result2 = await eventTemplateService.createEvents([updatedEvent]);
		console.log('✅ Updated event:', result2.events[0].slug);
		console.log('   Name:', result2.events[0].name);
		console.log('   Created:', result2.events[0].createdAt);
		console.log('   Updated:', result2.events[0].updatedAt);

		// Test 3: Verify the event exists in database
		console.log('\n📝 Test 3: Verifying event in database...');
		const dbEvent = await EventTemplate.findOne({
			where: { slug: testEvent.slug },
		});
		if (dbEvent) {
			console.log('✅ Event found in database');
			console.log('   Name:', dbEvent.name);
			console.log('   Active:', dbEvent.active);
		} else {
			console.log('❌ Event not found in database');
		}

		// Test 3.5: Test getAllEvents returns JSON
		console.log('\n📝 Test 3.5: Testing getAllEvents JSON response...');
		const allEvents = await eventTemplateService.getAllEvents();
		console.log('✅ getAllEvents returned:', allEvents.length, 'events');
		console.log('   Type:', typeof allEvents); // Should be 'object' (array)
		console.log('   First event type:', typeof allEvents[0]); // Should be 'object' (JSON)

		// Test 4: Test with multiple events
		console.log('\n📝 Test 4: Testing with multiple events...');
		const multipleEvents = [
			{
				slug: 'test_multiple_1',
				name: 'Test Multiple 1',
				description: { en: 'First test', ru: 'Первый тест' },
				type: 'RANDOM',
				triggerConfig: {},
				effect: {},
				frequency: {},
				conditions: {},
				active: true,
			},
			{
				slug: 'test_multiple_2',
				name: 'Test Multiple 2',
				description: { en: 'Second test', ru: 'Второй тест' },
				type: 'PERIODIC',
				triggerConfig: {},
				effect: {},
				frequency: {},
				conditions: {},
				active: false,
			},
		];

		const result3 = await eventTemplateService.createEvents(multipleEvents);
		console.log(
			'✅ Created/Updated multiple events:',
			result3.events.length
		);
		result3.events.forEach((event, index) => {
			console.log(
				`   ${index + 1}. ${event.slug} - ${event.name} (${
					event.active ? 'Active' : 'Inactive'
				})`
			);
		});

		// Test 5: Update one of the multiple events
		console.log('\n📝 Test 5: Updating one of the multiple events...');
		const updateMultiple = [
			{
				slug: 'test_multiple_1',
				name: 'Updated Test Multiple 1',
				description: {
					en: 'Updated first test',
					ru: 'Обновленный первый тест',
				},
				type: 'RANDOM',
				triggerConfig: {},
				effect: {},
				frequency: {},
				conditions: {},
				active: true,
			},
		];

		const result4 = await eventTemplateService.createEvents(updateMultiple);
		console.log('✅ Updated event:', result4.events[0].name);

		// Test 6: Test getEvent returns JSON
		console.log('\n📝 Test 6: Testing getEvent JSON response...');
		const singleEvent = await eventTemplateService.getEvent(
			'test_multiple_1'
		);
		console.log('✅ getEvent returned event:', singleEvent.name);
		console.log('   Type:', typeof singleEvent); // Should be 'object' (JSON)

		// Test 7: Test toggleEventActive returns JSON
		console.log('\n📝 Test 7: Testing toggleEventActive JSON response...');
		const toggledEvent = await eventTemplateService.toggleEventActive(
			'test_multiple_1'
		);
		console.log('✅ toggleEventActive returned event:', toggledEvent.name);
		console.log('   Active status:', toggledEvent.active);
		console.log('   Type:', typeof toggledEvent); // Should be 'object' (JSON)

		// Cleanup
		console.log('\n🧹 Cleaning up test data...');
		const testSlugs = [
			'test_find_or_create',
			'test_multiple_1',
			'test_multiple_2',
		];

		for (const slug of testSlugs) {
			try {
				await eventTemplateService.deleteEvent(slug);
				console.log(`   ✅ Deleted: ${slug}`);
			} catch (error) {
				console.log(`   ⚠️  Could not delete ${slug}:`, error.message);
			}
		}

		console.log(
			'\n🎉 Event Template findOrCreate testing completed successfully!'
		);
	} catch (error) {
		console.error('❌ Error testing event findOrCreate:', error.message);
		console.error(error.stack);
	} finally {
		await sequelize.close();
		process.exit(0);
	}
}

testEventFindOrCreate();
