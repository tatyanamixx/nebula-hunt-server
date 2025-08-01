const { EventTemplate, sequelize } = require('./models/models');
const eventTemplateService = require('./service/event-template-service');

async function testEventValidation() {
	try {
		console.log('🧪 Testing Event Template validation...\n');

		// Test 1: Valid event data
		console.log('📝 Test 1: Creating event with valid data...');
		const validEvent = {
			slug: 'test_validation',
			name: 'Test Validation Event',
			description: {
				en: 'Test event for validation',
				ru: 'Тестовое событие для валидации',
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

		const result1 = await eventTemplateService.createEvents([validEvent]);
		console.log('✅ Created event:', result1.events[0].slug);
		console.log('   ID:', result1.events[0].id);
		console.log('   Name:', result1.events[0].name);

		// Test 2: Invalid event data (missing slug)
		console.log('\n📝 Test 2: Testing with missing slug...');
		const invalidEvent = {
			name: 'Invalid Event',
			type: 'RANDOM',
			effect: {
				multipliers: {
					cps: 1.5,
				},
			},
		};

		try {
			await eventTemplateService.createEvents([invalidEvent]);
			console.log('❌ Should have failed with missing slug');
		} catch (error) {
			console.log('✅ Correctly failed with error:', error.message);
		}

		// Test 3: Invalid event data (missing name)
		console.log('\n📝 Test 3: Testing with missing name...');
		const invalidEvent2 = {
			slug: 'invalid_event_2',
			type: 'RANDOM',
			effect: {
				multipliers: {
					cps: 1.5,
				},
			},
		};

		try {
			await eventTemplateService.createEvents([invalidEvent2]);
			console.log('❌ Should have failed with missing name');
		} catch (error) {
			console.log('✅ Correctly failed with error:', error.message);
		}

		// Test 4: Invalid event data (missing type)
		console.log('\n📝 Test 4: Testing with missing type...');
		const invalidEvent3 = {
			slug: 'invalid_event_3',
			name: 'Invalid Event 3',
			effect: {
				multipliers: {
					cps: 1.5,
				},
			},
		};

		try {
			await eventTemplateService.createEvents([invalidEvent3]);
			console.log('❌ Should have failed with missing type');
		} catch (error) {
			console.log('✅ Correctly failed with error:', error.message);
		}

		// Test 5: Invalid event data (missing effect)
		console.log('\n📝 Test 5: Testing with missing effect...');
		const invalidEvent4 = {
			slug: 'invalid_event_4',
			name: 'Invalid Event 4',
			type: 'RANDOM',
		};

		try {
			await eventTemplateService.createEvents([invalidEvent4]);
			console.log('❌ Should have failed with missing effect');
		} catch (error) {
			console.log('✅ Correctly failed with error:', error.message);
		}

		// Cleanup
		console.log('\n🧹 Cleaning up test data...');
		try {
			await eventTemplateService.deleteEvent('test_validation');
			console.log('   ✅ Deleted: test_validation');
		} catch (error) {
			console.log('   ⚠️  Could not delete test_validation:', error.message);
		}

		console.log('\n🎉 Event Template validation testing completed successfully!');
	} catch (error) {
		console.error('❌ Error testing event validation:', error.message);
		console.error(error.stack);
	} finally {
		await sequelize.close();
		process.exit(0);
	}
}

testEventValidation(); 