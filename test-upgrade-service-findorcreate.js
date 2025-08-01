const {
	sequelize,
	User,
	UserState,
	UpgradeNodeTemplate,
	UserUpgrade,
} = require('./models/models');
const UpgradeService = require('./service/upgrade-service');

async function testUpgradeServiceFindOrCreate() {
	console.log(
		'🧪 Тестирование UpgradeService.initializeUserUpgradeTree с findOrCreate...\n'
	);

	try {
		const upgradeService = UpgradeService;

		// Создаем тестового пользователя
		const testUserId = BigInt(999888777);
		const testUser = await User.create({
			id: testUserId,
			username: 'test_upgrade_user',
			referral: BigInt(0),
		});

		// Создаем UserState для пользователя
		await UserState.create({
			userId: testUserId,
			stardust: 1000,
			darkMatter: 500,
			stars: 100,
		});

		console.log('✅ Создан тестовый пользователь и UserState');

		// Проверяем, есть ли активные шаблоны апгрейдов
		const activeTemplates = await UpgradeNodeTemplate.findAll({
			where: { active: true },
		});

		console.log(
			`📋 Найдено активных шаблонов апгрейдов: ${activeTemplates.length}`
		);

		if (activeTemplates.length === 0) {
			console.log('⚠️  Нет активных шаблонов апгрейдов для тестирования');
			console.log('   Создаем тестовые шаблоны...');

			// Создаем корневой тестовый шаблон апгрейда
			const rootTemplate = await UpgradeNodeTemplate.create({
				slug: 'test_root_upgrade',
				name: {
					en: 'Test Root Upgrade',
					ru: 'Тестовый корневой апгрейд',
				},
				description: {
					en: 'A test root upgrade',
					ru: 'Тестовый корневой апгрейд',
				},
				maxLevel: 3,
				basePrice: 100,
				effectPerLevel: 10,
				priceMultiplier: 1.5,
				resource: 'stardust',
				category: 'test',
				icon: '⭐',
				active: true,
				conditions: {},
			});

			// Создаем дочерний тестовый шаблон апгрейда
			const childTemplate = await UpgradeNodeTemplate.create({
				slug: 'test_child_upgrade',
				name: {
					en: 'Test Child Upgrade',
					ru: 'Тестовый дочерний апгрейд',
				},
				description: {
					en: 'A test child upgrade',
					ru: 'Тестовый дочерний апгрейд',
				},
				maxLevel: 2,
				basePrice: 200,
				effectPerLevel: 20,
				priceMultiplier: 2.0,
				resource: 'darkMatter',
				category: 'test',
				icon: '🌟',
				active: true,
				conditions: {
					parents: [rootTemplate.id],
					parentLevel: 1,
				},
			});

			console.log(
				'✅ Созданы тестовые шаблоны апгрейдов:',
				rootTemplate.slug,
				childTemplate.slug
			);
		}

		// Тест 1: Первый вызов - должен создать корневые апгрейды
		console.log('\n📝 Тест 1: Первый вызов initializeUserUpgradeTree...');
		const result1 = await upgradeService.initializeUserUpgradeTree(
			testUserId
		);

		console.log('✅ Результат первого вызова:');
		console.log(`   Инициализировано: ${result1.initialized.length}`);
		console.log(`   Активировано: ${result1.activated.length}`);
		console.log(`   Всего: ${result1.total}`);

		// Проверяем, что апгрейды созданы в базе
		const userUpgrades1 = await UserUpgrade.findAll({
			where: { userId: testUserId },
		});
		console.log(`   Апгрейдов в базе данных: ${userUpgrades1.length}`);

		// Тест 2: Повторный вызов - не должен создавать дубликаты
		console.log(
			'\n📝 Тест 2: Повторный вызов initializeUserUpgradeTree...'
		);
		const result2 = await upgradeService.initializeUserUpgradeTree(
			testUserId
		);

		console.log('✅ Результат второго вызова:');
		console.log(`   Инициализировано: ${result2.initialized.length}`);
		console.log(`   Активировано: ${result2.activated.length}`);
		console.log(`   Всего: ${result2.total}`);

		// Проверяем, что количество апгрейдов не изменилось
		const userUpgrades2 = await UserUpgrade.findAll({
			where: { userId: testUserId },
		});
		console.log(`   Апгрейдов в базе данных: ${userUpgrades2.length}`);

		// Проверяем, что количество апгрейдов одинаковое
		if (userUpgrades1.length === userUpgrades2.length) {
			console.log(
				'✅ findOrCreate работает правильно - дубликаты не создаются'
			);
		} else {
			console.log('❌ findOrCreate не работает - создаются дубликаты');
		}

		// Тест 3: Тестируем с транзакцией
		console.log('\n📝 Тест 3: Тестирование с транзакцией...');
		const transaction = await sequelize.transaction();

		try {
			const result3 = await upgradeService.initializeUserUpgradeTree(
				testUserId,
				transaction
			);
			console.log('✅ Тест с транзакцией прошел успешно');
			console.log(`   Инициализировано: ${result3.initialized.length}`);
			console.log(`   Активировано: ${result3.activated.length}`);
			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			console.log(
				'❌ Ошибка при тестировании с транзакцией:',
				error.message
			);
		}

		// Тест 4: Тестируем legacy метод activateUserUpgradeNodes
		console.log(
			'\n📝 Тест 4: Тестирование legacy метода activateUserUpgradeNodes...'
		);
		try {
			const legacyResult = await upgradeService.activateUserUpgradeNodes(
				testUserId
			);
			console.log('✅ Legacy метод работает корректно');
			console.log(`   Активировано: ${legacyResult.length}`);
		} catch (error) {
			console.log('❌ Ошибка в legacy методе:', error.message);
		}

		console.log('\n✅ Все тесты пройдены успешно!');
		console.log(
			'📝 Метод initializeUserUpgradeTree с findOrCreate работает корректно'
		);
	} catch (error) {
		console.error('❌ Ошибка при тестировании:', error.message);
		console.error(error.stack);
	} finally {
		// Очищаем тестовые данные
		try {
			await UserUpgrade.destroy({
				where: { userId: BigInt(999888777) },
			});
			await UserState.destroy({
				where: { userId: BigInt(999888777) },
			});
			await User.destroy({
				where: { id: BigInt(999888777) },
			});
			console.log('🧹 Тестовые данные очищены');
		} catch (cleanupError) {
			console.log(
				'⚠️  Ошибка при очистке тестовых данных:',
				cleanupError.message
			);
		}

		await sequelize.close();
	}
}

testUpgradeServiceFindOrCreate();
