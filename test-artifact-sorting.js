const { ArtifactTemplate } = require('./models/models');

async function testArtifactSorting() {
	try {
		console.log('🧪 Testing Artifact Sorting by baseChance...\n');

		// Создаем тестовые артефакты с разными baseChance
		const testArtifacts = [
			{
				slug: 'common_artifact',
				name: 'Common Artifact',
				description: {
					en: 'A common artifact',
					ru: 'Обычный артефакт',
				},
				rarity: 'COMMON',
				image: '⭐',
				effects: { commonEffect: 0.1 },
				baseChance: 0.05, // 5%
				limited: false,
			},
			{
				slug: 'legendary_artifact',
				name: 'Legendary Artifact',
				description: {
					en: 'A legendary artifact',
					ru: 'Легендарный артефакт',
				},
				rarity: 'LEGENDARY',
				image: '💎',
				effects: { legendaryEffect: 1.0 },
				baseChance: 0.001, // 0.1%
				limited: true,
				limitedCount: 1,
			},
			{
				slug: 'rare_artifact',
				name: 'Rare Artifact',
				description: {
					en: 'A rare artifact',
					ru: 'Редкий артефакт',
				},
				rarity: 'RARE',
				image: '🌟',
				effects: { rareEffect: 0.5 },
				baseChance: 0.02, // 2%
				limited: false,
			},
			{
				slug: 'epic_artifact',
				name: 'Epic Artifact',
				description: {
					en: 'An epic artifact',
					ru: 'Эпический артефакт',
				},
				rarity: 'EPIC',
				image: '🔥',
				effects: { epicEffect: 0.8 },
				baseChance: 0.01, // 1%
				limited: true,
				limitedCount: 10,
			},
		];

		// Создаем артефакты в базе данных
		console.log('📝 Creating test artifacts...');
		for (const artifactData of testArtifacts) {
			await ArtifactTemplate.findOrCreate({
				where: { slug: artifactData.slug },
				defaults: artifactData,
			});
		}
		console.log('✅ Test artifacts created\n');

		// Тестируем сортировку по baseChance (ASC)
		console.log('🔄 Testing sorting by baseChance (ASC)...');
		const sortedAsc = await ArtifactTemplate.findAll({
			order: [
				['baseChance', 'ASC'],
				['slug', 'ASC'],
			],
			attributes: ['slug', 'name', 'baseChance', 'rarity'],
		});

		console.log('📊 Sorted by baseChance (ASC):');
		sortedAsc.forEach((artifact, index) => {
			console.log(
				`  ${index + 1}. ${artifact.name} (${artifact.slug}): ${(
					artifact.baseChance * 100
				).toFixed(1)}% [${artifact.rarity}]`
			);
		});

		// Тестируем сортировку по baseChance (DESC)
		console.log('\n🔄 Testing sorting by baseChance (DESC)...');
		const sortedDesc = await ArtifactTemplate.findAll({
			order: [
				['baseChance', 'DESC'],
				['slug', 'ASC'],
			],
			attributes: ['slug', 'name', 'baseChance', 'rarity'],
		});

		console.log('📊 Sorted by baseChance (DESC):');
		sortedDesc.forEach((artifact, index) => {
			console.log(
				`  ${index + 1}. ${artifact.name} (${artifact.slug}): ${(
					artifact.baseChance * 100
				).toFixed(1)}% [${artifact.rarity}]`
			);
		});

		// Тестируем сортировку по редкости
		console.log('\n🔄 Testing sorting by rarity...');
		const sortedByRarity = await ArtifactTemplate.findAll({
			order: [
				['rarity', 'ASC'],
				['slug', 'ASC'],
			],
			attributes: ['slug', 'name', 'baseChance', 'rarity'],
		});

		console.log('📊 Sorted by rarity:');
		sortedByRarity.forEach((artifact, index) => {
			console.log(
				`  ${index + 1}. ${artifact.name} (${artifact.slug}): ${(
					artifact.baseChance * 100
				).toFixed(1)}% [${artifact.rarity}]`
			);
		});

		// Проверяем, что сортировка работает правильно
		console.log('\n✅ Verification:');
		const baseChances = sortedAsc.map((a) => a.baseChance);
		const isAscending = baseChances.every(
			(val, i) => i === 0 || val >= baseChances[i - 1]
		);
		console.log(`  ASC sorting is correct: ${isAscending ? '✅' : '❌'}`);

		const baseChancesDesc = sortedDesc.map((a) => a.baseChance);
		const isDescending = baseChancesDesc.every(
			(val, i) => i === 0 || val <= baseChancesDesc[i - 1]
		);
		console.log(`  DESC sorting is correct: ${isDescending ? '✅' : '❌'}`);

		// Очищаем тестовые данные
		console.log('\n🧹 Cleaning up test data...');
		for (const artifactData of testArtifacts) {
			await ArtifactTemplate.destroy({
				where: { slug: artifactData.slug },
			});
		}
		console.log('✅ Test data cleaned up');

		console.log('\n🎉 Sorting test completed successfully!');
	} catch (error) {
		console.error('❌ Error testing artifact sorting:', error);
	} finally {
		process.exit(0);
	}
}

testArtifactSorting();
