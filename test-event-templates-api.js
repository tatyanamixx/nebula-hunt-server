const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testEventTemplatesAPI() {
	try {
		console.log('🧪 Testing Event Templates API...\n');

		// Test 1: Get all event templates
		console.log('1️⃣ Testing GET /event-templates');
		try {
			const response = await axios.get(`${API_BASE}/event-templates`);
			console.log('✅ GET /event-templates - Success');
			console.log(`   Found ${response.data.length} event templates`);

			// Show first event if exists
			if (response.data.length > 0) {
				const firstEvent = response.data[0];
				console.log(
					`   First event: ${firstEvent.name} (${firstEvent.slug})`
				);
				console.log(`   Type: ${firstEvent.type}`);
				console.log(`   Active: ${firstEvent.active}`);
			}
		} catch (error) {
			console.log(
				'❌ GET /event-templates - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 2: Create a test event template
		console.log('\n2️⃣ Testing POST /event-templates');
		const testEvent = {
			slug: 'test_api_event',
			name: 'Test API Event',
			description: {
				en: 'Test event created via API',
				ru: 'Тестовое событие созданное через API',
			},
			type: 'RANDOM',
			triggerConfig: {
				chancePerMinute: 0.01,
			},
			effect: {
				multipliers: {
					cps: 1.5,
				},
				duration: 300,
			},
			frequency: {
				maxPerHour: 1,
			},
			conditions: {
				minLevel: 5,
			},
			active: true,
		};

		try {
			const response = await axios.post(`${API_BASE}/event-templates`, [
				testEvent,
			]);
			console.log('✅ POST /event-templates - Success');
			console.log(`   Created event: ${response.data.events[0].name}`);
			console.log(`   Type: ${response.data.events[0].type}`);
			console.log(`   Active: ${response.data.events[0].active}`);
		} catch (error) {
			console.log(
				'❌ POST /event-templates - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 3: Update the test event template
		console.log('\n3️⃣ Testing PUT /event-templates/:slug');
		const updatedEvent = {
			...testEvent,
			name: 'Updated Test API Event',
			effect: {
				multipliers: {
					cps: 2.0,
				},
				duration: 600,
			},
		};

		try {
			const response = await axios.put(
				`${API_BASE}/event-templates/${testEvent.slug}`,
				updatedEvent
			);
			console.log('✅ PUT /event-templates/:slug - Success');
			console.log(`   Updated event: ${response.data.name}`);
			console.log(
				`   New effect duration: ${response.data.effect.duration}`
			);
		} catch (error) {
			console.log(
				'❌ PUT /event-templates/:slug - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 4: Get specific event template
		console.log('\n4️⃣ Testing GET /event-templates/:slug');
		try {
			const response = await axios.get(
				`${API_BASE}/event-templates/${testEvent.slug}`
			);
			console.log('✅ GET /event-templates/:slug - Success');
			console.log(`   Retrieved event: ${response.data.name}`);
			console.log(`   Type: ${response.data.type}`);
			console.log(`   Active: ${response.data.active}`);
		} catch (error) {
			console.log(
				'❌ GET /event-templates/:slug - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 5: Toggle event status
		console.log('\n5️⃣ Testing PUT /event-templates/:slug/toggle');
		try {
			const response = await axios.put(
				`${API_BASE}/event-templates/${testEvent.slug}/toggle`
			);
			console.log('✅ PUT /event-templates/:slug/toggle - Success');
			console.log(`   Toggled event status: ${response.data.active}`);
		} catch (error) {
			console.log(
				'❌ PUT /event-templates/:slug/toggle - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 6: Delete the test event template
		console.log('\n6️⃣ Testing DELETE /event-templates/:slug');
		try {
			const response = await axios.delete(
				`${API_BASE}/event-templates/${testEvent.slug}`
			);
			console.log('✅ DELETE /event-templates/:slug - Success');
			console.log(`   Deleted event: ${response.data.message}`);
		} catch (error) {
			console.log(
				'❌ DELETE /event-templates/:slug - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		console.log('\n🎉 Event Templates API testing completed!');
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
}

testEventTemplatesAPI();
