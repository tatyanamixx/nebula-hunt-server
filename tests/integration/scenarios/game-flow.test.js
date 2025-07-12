const UserService = require('../../service/user-service');
const TaskService = require('../../service/task-service');
const MarketService = require('../../service/market-service');
const {
	User,
	UserState,
	Task,
	TaskTemplate,
	MarketOffer,
} = require('../../models');

describe('Complete Game Flow Integration Tests', () => {
	let user, taskTemplate;

	beforeEach(async () => {
		// Очистка всех данных
		await MarketOffer.destroy({ where: {} });
		await Task.destroy({ where: {} });
		await TaskTemplate.destroy({ where: {} });
		await UserState.destroy({ where: {} });
		await User.destroy({ where: {} });

		// Создаем шаблон задачи
		taskTemplate = await TaskTemplate.create({
			name: 'Explore Galaxy',
			description: 'Explore a new galaxy',
			type: 'exploration',
			difficulty: 1,
			experienceReward: 100,
			currencyReward: 50,
			currencyType: 'TON',
			duration: 3600, // 1 час
			requirements: {
				minLevel: 1,
				artifacts: [],
			},
		});
	});

	test('complete user registration -> task completion -> reward -> market trade', async () => {
		// 1. Регистрация пользователя
		const userData = {
			telegramId: 999,
			username: 'gamer',
			firstName: 'Game',
			lastName: 'Player',
		};

		const registration = await UserService.createUser(userData);
		user = registration.user;

		expect(user).toBeDefined();
		expect(user.telegramId).toBe(userData.telegramId);

		// Проверяем создание состояния пользователя
		const userState = await UserService.getUserState(user.id);
		expect(userState).toBeDefined();
		expect(userState.level).toBe(1);
		expect(userState.experience).toBe(0);
		expect(userState.balance).toBe(0);

		// 2. Назначение и выполнение задачи
		const task = await TaskService.assignTask(user.id, taskTemplate.id);
		expect(task).toBeDefined();
		expect(task.userId).toBe(user.id);
		expect(task.templateId).toBe(taskTemplate.id);
		expect(task.status).toBe('assigned');

		// Симулируем выполнение задачи
		const completion = await TaskService.completeTask(user.id, task.id);
		expect(completion).toBeDefined();
		expect(completion.status).toBe('completed');

		// 3. Проверяем получение награды
		const updatedUserState = await UserService.getUserState(user.id);
		expect(updatedUserState.experience).toBe(taskTemplate.experienceReward);
		expect(updatedUserState.balance).toBe(taskTemplate.currencyReward);

		// 4. Создание предложения на рынке
		const offerData = {
			sellerId: user.id,
			itemType: 'artifact',
			itemId: 1,
			price: 25,
			currency: 'TON',
		};

		const offer = await MarketService.createOffer(offerData);
		expect(offer).toBeDefined();
		expect(offer.sellerId).toBe(user.id);
		expect(offer.status).toBe('active');

		// 5. Проверяем, что предложение доступно в списке
		const offers = await MarketService.getOffers();
		expect(offers).toHaveLength(1);
		expect(offers[0].id).toBe(offer.id);

		// 6. Создаем второго пользователя для покупки
		const buyerData = {
			telegramId: 888,
			username: 'buyer',
			firstName: 'Buyer',
			lastName: 'User',
		};

		const buyerRegistration = await UserService.createUser(buyerData);
		const buyer = buyerRegistration.user;

		// Даем покупателю деньги
		await UserState.update(
			{ balance: 100 },
			{ where: { userId: buyer.id } }
		);

		// 7. Обрабатываем транзакцию
		const transactionData = {
			offerId: offer.id,
			buyerId: buyer.id,
		};

		const transaction = await MarketService.processTransaction(
			transactionData
		);
		expect(transaction).toBeDefined();
		expect(transaction.status).toBe('completed');

		// 8. Проверяем изменения в системе
		const finalSellerState = await UserService.getUserState(user.id);
		const finalBuyerState = await UserService.getUserState(buyer.id);
		const finalOffer = await MarketOffer.findByPk(offer.id);

		// Продавец получил деньги
		expect(finalSellerState.balance).toBe(taskTemplate.currencyReward + 25);

		// Покупатель потратил деньги
		expect(finalBuyerState.balance).toBe(100 - 25);

		// Предложение продано
		expect(finalOffer.status).toBe('sold');
	});

	test('should handle task failure and retry', async () => {
		// Создаем пользователя
		const userData = {
			telegramId: 777,
			username: 'tester',
			firstName: 'Test',
			lastName: 'User',
		};

		const registration = await UserService.createUser(userData);
		user = registration.user;

		// Назначаем задачу
		const task = await TaskService.assignTask(user.id, taskTemplate.id);
		expect(task.status).toBe('assigned');

		// Симулируем неудачу задачи
		await Task.update({ status: 'failed' }, { where: { id: task.id } });

		// Проверяем, что пользователь не получил награду
		const userState = await UserService.getUserState(user.id);
		expect(userState.experience).toBe(0);
		expect(userState.balance).toBe(0);

		// Повторно назначаем задачу
		const newTask = await TaskService.assignTask(user.id, taskTemplate.id);
		expect(newTask.id).not.toBe(task.id);
		expect(newTask.status).toBe('assigned');
	});
});
