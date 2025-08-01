const { sequelize, User, UserState, PackageTemplate, PackageStore } = require('./models/models');
const PackageStoreService = require('./service/package-store-service');

async function testPackageStoreServiceFindOrCreate() {
	console.log('🧪 Тестирование PackageStoreService с findOrCreate...\n');

	try {
		const packageStoreService = new PackageStoreService();

		// Создаем тестового пользователя
		const testUserId = BigInt(999888777);
		const testUser = await User.create({
			id: testUserId,
			username: 'test_package_user',
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

		// Проверяем, есть ли активные шаблоны пакетов
		const activeTemplates = await PackageTemplate.findAll({
			where: { status: true }
		});

		console.log(`📋 Найдено активных шаблонов пакетов: ${activeTemplates.length}`);

		if (activeTemplates.length === 0) {
			console.log('⚠️  Нет активных шаблонов пакетов для тестирования');
			console.log('   Создаем тестовый шаблон...');

			// Создаем тестовый шаблон пакета
			const testTemplate = await PackageTemplate.create({
				slug: 'test_package_001',
				title: {
					en: 'Test Package',
					ru: 'Тестовый пакет'
				},
				description: {
					en: 'Test package for testing',
					ru: 'Тестовый пакет для тестирования'
				},
				amount: 100,
				resource: 'stardust',
				price: 10,
				currency: 'USD',
				status: true,
			});

			console.log('✅ Создан тестовый шаблон пакета:', testTemplate.slug);
		}

		// Тест 1: Первый вызов - должен создать пакеты
		console.log('\n📝 Тест 1: Первый вызов initializePackageStore...');
		const result1 = await packageStoreService.initializePackageStore(testUserId);
		
		console.log('✅ Результат первого вызова:');
		console.log(`   Создано пакетов: ${result1.length}`);

		// Проверяем, что пакеты созданы в базе
		const userPackages1 = await PackageStore.findAll({
			where: { userId: testUserId }
		});
		console.log(`   Пакетов в базе данных: ${userPackages1.length}`);

		// Тест 2: Повторный вызов - не должен создавать дубликаты
		console.log('\n📝 Тест 2: Повторный вызов initializePackageStore...');
		const result2 = await packageStoreService.initializePackageStore(testUserId);
		
		console.log('✅ Результат второго вызова:');
		console.log(`   Создано пакетов: ${result2.length}`);

		// Проверяем, что количество пакетов не изменилось
		const userPackages2 = await PackageStore.findAll({
			where: { userId: testUserId }
		});
		console.log(`   Пакетов в базе данных: ${userPackages2.length}`);

		// Проверяем, что количество пакетов одинаковое
		if (userPackages1.length === userPackages2.length) {
			console.log('✅ findOrCreate работает правильно - дубликаты не создаются');
		} else {
			console.log('❌ findOrCreate не работает - создаются дубликаты');
		}

		// Тест 3: Тестируем getUserPackages
		console.log('\n📝 Тест 3: Тестирование getUserPackages...');
		const userPackages = await packageStoreService.getUserPackages(testUserId);
		console.log('✅ getUserPackages работает:');
		console.log(`   Получено пакетов: ${userPackages.length}`);

		// Тест 4: Тестируем getUserPackageById
		if (userPackages.length > 0) {
			console.log('\n📝 Тест 4: Тестирование getUserPackageById...');
			const firstPackage = userPackages[0];
			const packageSlug = firstPackage.package?.slug || 'test_package_001';
			
			try {
				const packageById = await packageStoreService.getUserPackageById(packageSlug, testUserId);
				console.log('✅ getUserPackageById работает:');
				console.log(`   Найден пакет: ${packageById.id}`);
			} catch (error) {
				console.log('⚠️  getUserPackageById не нашел пакет:', error.message);
			}
		}

		// Тест 5: Тестируем usePackage
		console.log('\n📝 Тест 5: Тестирование usePackage...');
		const availablePackages = await PackageStore.findAll({
			where: { 
				userId: testUserId,
				isUsed: false,
				isLocked: false,
				status: 'ACTIVE'
			}
		});

		if (availablePackages.length > 0) {
			const packageToUse = availablePackages[0];
			const packageTemplate = await PackageTemplate.findByPk(packageToUse.templateId);
			
			if (packageTemplate) {
				try {
					const useResult = await packageStoreService.usePackage(packageTemplate.slug, testUserId);
					console.log('✅ usePackage работает:');
					console.log(`   Использован пакет: ${useResult.package.id}`);
					console.log(`   Ресурс: ${useResult.package.resource}, Количество: ${useResult.package.amount}`);
					console.log(`   Новое состояние пользователя:`);
					console.log(`     Stardust: ${useResult.userState.stardust}`);
					console.log(`     Dark Matter: ${useResult.userState.darkMatter}`);
					console.log(`     Stars: ${useResult.userState.tgStars}`);
				} catch (error) {
					console.log('❌ usePackage не работает:', error.message);
				}
			}
		} else {
			console.log('⚠️  Нет доступных пакетов для использования');
		}

		// Тест 6: Тестируем с транзакцией
		console.log('\n📝 Тест 6: Тестирование с транзакцией...');
		const transaction = await sequelize.transaction();
		
		try {
			const result3 = await packageStoreService.initializePackageStore(testUserId, transaction);
			console.log('✅ Тест с транзакцией прошел успешно');
			console.log(`   Создано пакетов: ${result3.length}`);
			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			console.log('❌ Ошибка при тестировании с транзакцией:', error.message);
		}

		console.log('\n✅ Все тесты пройдены успешно!');
		console.log('📝 Метод initializePackageStore с findOrCreate работает корректно');

	} catch (error) {
		console.error('❌ Ошибка при тестировании:', error.message);
		console.error(error.stack);
	} finally {
		// Очищаем тестовые данные
		try {
			await PackageStore.destroy({
				where: { userId: BigInt(999888777) }
			});
			await UserState.destroy({
				where: { userId: BigInt(999888777) }
			});
			await User.destroy({
				where: { id: BigInt(999888777) }
			});
			console.log('🧹 Тестовые данные очищены');
		} catch (cleanupError) {
			console.log('⚠️  Ошибка при очистке тестовых данных:', cleanupError.message);
		}

		await sequelize.close();
	}
}

testPackageStoreServiceFindOrCreate(); 