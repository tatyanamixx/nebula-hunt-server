const { ArtifactTemplate } = require('./models/models');

async function testArtifactBaseChance() {
	try {
		console.log('Testing ArtifactTemplate with baseChance field...\n');

		// Создаем тестовый артефакт с baseChance
		const testArtifact = await ArtifactTemplate.create({
			slug: 'test_base_chance_artifact',
			name: 'Test Base Chance Artifact',
			description: {
				en: 'Test artifact with base chance',
				ru: 'Тестовый артефакт с базовым шансом',
			},
			rarity: 'RARE',
			image: '🧪',
			effects: {
				testEffect: 0.5,
			},
			baseChance: 0.025, // 2.5% шанс
			limited: false,
		});

		console.log(
			'✅ Created artifact with baseChance:',
			testArtifact.baseChance
		);
		console.log('Artifact details:', {
			id: testArtifact.id,
			slug: testArtifact.slug,
			name: testArtifact.name,
			baseChance: testArtifact.baseChance,
			baseChancePercent: (testArtifact.baseChance * 100).toFixed(1) + '%',
		});

		// Обновляем baseChance
		await testArtifact.update({
			baseChance: 0.05, // 5% шанс
		});

		console.log('\n✅ Updated baseChance to:', testArtifact.baseChance);
		console.log(
			'New baseChance percent:',
			(testArtifact.baseChance * 100).toFixed(1) + '%'
		);

		// Получаем артефакт заново для проверки
		const retrievedArtifact = await ArtifactTemplate.findOne({
			where: { slug: 'test_base_chance_artifact' },
		});

		console.log(
			'\n✅ Retrieved artifact baseChance:',
			retrievedArtifact.baseChance
		);

		// Удаляем тестовый артефакт
		await testArtifact.destroy();
		console.log('\n✅ Test artifact deleted');

		// Проверяем все артефакты с baseChance
		const allArtifacts = await ArtifactTemplate.findAll({
			attributes: ['slug', 'name', 'baseChance', 'rarity'],
		});

		console.log('\n📊 All artifacts with baseChance:');
		allArtifacts.forEach((artifact) => {
			console.log(
				`- ${artifact.name} (${artifact.slug}): ${(
					artifact.baseChance * 100
				).toFixed(1)}% [${artifact.rarity}]`
			);
		});

		console.log('\n🎉 Test completed successfully!');
	} catch (error) {
		console.error('❌ Error testing artifact baseChance:', error);
	} finally {
		process.exit(0);
	}
}

testArtifactBaseChance();
