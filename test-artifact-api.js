const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testArtifactAPI() {
	try {
		console.log('🧪 Testing Artifact API...\n');

		// Test 1: Get all artifacts
		console.log('1️⃣ Testing GET /artifact-templates');
		try {
			const response = await axios.get(`${API_BASE}/artifact-templates`);
			console.log('✅ GET /artifact-templates - Success');
			console.log(`   Found ${response.data.length} artifacts`);

			// Show first artifact if exists
			if (response.data.length > 0) {
				const firstArtifact = response.data[0];
				console.log(
					`   First artifact: ${firstArtifact.name} (${firstArtifact.slug})`
				);
				console.log(
					`   Base chance: ${firstArtifact.baseChance || 'not set'}`
				);
			}
		} catch (error) {
			console.log(
				'❌ GET /artifact-templates - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 2: Create a test artifact
		console.log('\n2️⃣ Testing POST /artifact-templates');
		const testArtifact = {
			slug: 'test_api_artifact',
			name: 'Test API Artifact',
			description: {
				en: 'Test artifact created via API',
				ru: 'Тестовый артефакт созданный через API',
			},
			rarity: 'COMMON',
			image: '🧪',
			effects: {
				testEffect: 0.1,
			},
			baseChance: 0.025,
			limited: false,
		};

		try {
			const response = await axios.post(
				`${API_BASE}/artifact-templates`,
				[testArtifact]
			);
			console.log('✅ POST /artifact-templates - Success');
			console.log(`   Created artifact: ${response.data[0].name}`);
			console.log(`   Base chance: ${response.data[0].baseChance}`);
		} catch (error) {
			console.log(
				'❌ POST /artifact-templates - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 3: Update the test artifact
		console.log('\n3️⃣ Testing PUT /artifact-templates/:slug');
		const updatedArtifact = {
			...testArtifact,
			name: 'Updated Test API Artifact',
			baseChance: 0.05,
		};

		try {
			const response = await axios.put(
				`${API_BASE}/artifact-templates/${testArtifact.slug}`,
				updatedArtifact
			);
			console.log('✅ PUT /artifact-templates/:slug - Success');
			console.log(`   Updated artifact: ${response.data.name}`);
			console.log(`   New base chance: ${response.data.baseChance}`);
		} catch (error) {
			console.log(
				'❌ PUT /artifact-templates/:slug - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 4: Get specific artifact
		console.log('\n4️⃣ Testing GET /artifact-templates/:slug');
		try {
			const response = await axios.get(
				`${API_BASE}/artifact-templates/${testArtifact.slug}`
			);
			console.log('✅ GET /artifact-templates/:slug - Success');
			console.log(`   Retrieved artifact: ${response.data.name}`);
			console.log(`   Base chance: ${response.data.baseChance}`);
		} catch (error) {
			console.log(
				'❌ GET /artifact-templates/:slug - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		// Test 5: Delete the test artifact
		console.log('\n5️⃣ Testing DELETE /artifact-templates/:slug');
		try {
			const response = await axios.delete(
				`${API_BASE}/artifact-templates/${testArtifact.slug}`
			);
			console.log('✅ DELETE /artifact-templates/:slug - Success');
			console.log(`   Deleted artifact: ${response.data.message}`);
		} catch (error) {
			console.log(
				'❌ DELETE /artifact-templates/:slug - Failed:',
				error.response?.status,
				error.response?.data?.message
			);
		}

		console.log('\n🎉 API testing completed!');
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
}

testArtifactAPI();
