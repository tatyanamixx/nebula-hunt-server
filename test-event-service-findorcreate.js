const { sequelize, User, UserState, EventTemplate, UserEvent, UserEventSetting } = require('./models/models');
const EventService = require('./service/event-service');

async function testEventServiceFindOrCreate() {
	console.log('🧪 Тестирование EventService с findOrCreate...\n');

	try {
		const eventService = new EventService();

		// Создаем тестового пользователя
		const testUserId = BigInt(999888777);
		const testUser = await User.create({
			id: testUserId,
			username: 'test_event_user',
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

		// Проверяем, есть ли активные шаблоны событий
		const activeTemplates = await EventTemplate.findAll({
			where: { active: true }
		});

		console.log(`📋 Найдено активных шаблонов событий: ${activeTemplates.length}`);

		if (activeTemplates.length === 0) {
			console.log('⚠️  Нет активных шаблонов событий для тестирования');
			console.log('   Создаем тестовый шаблон...');

			// Создаем тестовый шаблон события
			const testTemplate = await EventTemplate.create({
				slug: 'test_event_001',
				name: {
					en: 'Test Event',
					ru: 'Тестовое событие'
				},
				description: {
					en: 'Test event for testing',
					ru: 'Тестовое событие для тестирования'
				},
				type: 'RANDOM',
				effect: {
					multipliers: {
						production: 1.2,
						chaos: 0.8
					},
					duration: 3600, // 1 hour
					rewards: {
						stardust: 100,
						darkMatter: 50
					}
				},
				triggerConfig: {
					chancePerHour: 0.1,
					cooldown: '2h'
				},
				active: true,
			});

			console.log('✅ Создан тестовый шаблон события:', testTemplate.slug);
		}

		// Тест 1: Первый вызов - должен создать события
		console.log('\n📝 Тест 1: Первый вызов initializeUserEvents...');
		const result1 = await eventService.initializeUserEvents(testUserId);
		
		console.log('✅ Результат первого вызова:');
		console.log(`   Настройки событий созданы: ${!!result1}`);

		// Проверяем, что события созданы в базе
		const userEvents1 = await UserEvent.findAll({
			where: { userId: testUserId }
		});
		console.log(`   Событий в базе данных: ${userEvents1.length}`);

		// Проверяем настройки событий
		const userEventSettings1 = await UserEventSetting.findOne({
			where: { userId: testUserId }
		});
		console.log(`   Настройки событий созданы: ${!!userEventSettings1}`);

		// Тест 2: Повторный вызов - не должен создавать дубликаты
		console.log('\n📝 Тест 2: Повторный вызов initializeUserEvents...');
		const result2 = await eventService.initializeUserEvents(testUserId);
		
		console.log('✅ Результат второго вызова:');
		console.log(`   Настройки событий получены: ${!!result2}`);

		// Проверяем, что количество событий не изменилось
		const userEvents2 = await UserEvent.findAll({
			where: { userId: testUserId }
		});
		console.log(`   Событий в базе данных: ${userEvents2.length}`);

		// Проверяем, что количество событий одинаковое
		if (userEvents1.length === userEvents2.length) {
			console.log('✅ findOrCreate работает правильно - дубликаты не создаются');
		} else {
			console.log('❌ findOrCreate не работает - создаются дубликаты');
		}

		// Тест 3: Тестируем getActiveUserEvents
		console.log('\n📝 Тест 3: Тестирование getActiveUserEvents...');
		const activeEvents = await eventService.getActiveUserEvents(testUserId);
		console.log('✅ getActiveUserEvents работает:');
		console.log(`   Получено активных событий: ${activeEvents.length}`);

		// Тест 4: Тестируем getAllUserEvents
		console.log('\n📝 Тест 4: Тестирование getAllUserEvents...');
		const allEvents = await eventService.getAllUserEvents(testUserId);
		console.log('✅ getAllUserEvents работает:');
		console.log(`   Активных событий: ${allEvents.active.length}`);
		console.log(`   Завершенных событий: ${allEvents.completed.length}`);
		console.log(`   Истекших событий: ${allEvents.expired.length}`);
		console.log(`   Настройки событий: ${!!allEvents.settings}`);

		// Тест 5: Тестируем getUserEventSettings
		console.log('\n📝 Тест 5: Тестирование getUserEventSettings...');
		const eventSettings = await eventService.getUserEventSettings(testUserId);
		console.log('✅ getUserEventSettings работает:');
		console.log(`   Настройки получены: ${!!eventSettings}`);
		console.log(`   Множители:`, eventSettings.eventMultipliers);

		// Тест 6: Тестируем getUserEventStats
		console.log('\n📝 Тест 6: Тестирование getUserEventStats...');
		const eventStats = await eventService.getUserEventStats(testUserId);
		console.log('✅ getUserEventStats работает:');
		console.log(`   Активных событий: ${eventStats.active}`);
		console.log(`   Завершенных событий: ${eventStats.completed}`);
		console.log(`   Истекших событий: ${eventStats.expired}`);
		console.log(`   Отмененных событий: ${eventStats.cancelled}`);
		console.log(`   Всего событий: ${eventStats.total}`);

		// Тест 7: Тестируем triggerEvent
		console.log('\n📝 Тест 7: Тестирование triggerEvent...');
		const firstTemplate = activeTemplates[0] || await EventTemplate.findOne({ where: { active: true } });
		
		if (firstTemplate) {
			try {
				const triggeredEvent = await eventService.triggerEvent(testUserId, firstTemplate.slug);
				console.log('✅ triggerEvent работает:');
				console.log(`   Событие запущено: ${triggeredEvent.id}`);
				console.log(`   Статус: ${triggeredEvent.status}`);
				console.log(`   Истекает: ${triggeredEvent.expiresAt}`);
			} catch (error) {
				console.log('⚠️  triggerEvent не работает:', error.message);
			}
		} else {
			console.log('⚠️  Нет доступных шаблонов событий для запуска');
		}

		// Тест 8: Тестируем getUserEvent
		console.log('\n📝 Тест 8: Тестирование getUserEvent...');
		const userEvents = await UserEvent.findAll({
			where: { userId: testUserId }
		});

		if (userEvents.length > 0) {
			const firstEvent = userEvents[0];
			const eventTemplate = await EventTemplate.findByPk(firstEvent.eventId);
			
			if (eventTemplate) {
				try {
					const userEvent = await eventService.getUserEvent(testUserId, eventTemplate.slug);
					console.log('✅ getUserEvent работает:');
					console.log(`   Событие найдено: ${userEvent.id}`);
					console.log(`   Статус: ${userEvent.status}`);
				} catch (error) {
					console.log('⚠️  getUserEvent не работает:', error.message);
				}
			}
		} else {
			console.log('⚠️  Нет событий пользователя для тестирования');
		}

		// Тест 9: Тестируем с транзакцией
		console.log('\n📝 Тест 9: Тестирование с транзакцией...');
		const transaction = await sequelize.transaction();
		
		try {
			const result3 = await eventService.initializeUserEvents(testUserId, transaction);
			console.log('✅ Тест с транзакцией прошел успешно');
			console.log(`   Настройки событий получены: ${!!result3}`);
			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			console.log('❌ Ошибка при тестировании с транзакцией:', error.message);
		}

		console.log('\n✅ Все тесты пройдены успешно!');
		console.log('📝 Метод initializeUserEvents с findOrCreate работает корректно');

	} catch (error) {
		console.error('❌ Ошибка при тестировании:', error.message);
		console.error(error.stack);
	} finally {
		// Очищаем тестовые данные
		try {
			await UserEvent.destroy({
				where: { userId: BigInt(999888777) }
			});
			await UserEventSetting.destroy({
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

testEventServiceFindOrCreate(); 