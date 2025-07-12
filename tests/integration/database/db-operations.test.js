const {
	User,
	UserState,
	Task,
	TaskTemplate,
	MarketOffer,
	Galaxy,
} = require('../../models');
const { sequelize } = require('../../db');

describe('Database Operations Integration Tests', () => {
	beforeEach(async () => {
		// Очистка всех таблиц
		await MarketOffer.destroy({ where: {} });
		await Task.destroy({ where: {} });
		await TaskTemplate.destroy({ where: {} });
		await UserState.destroy({ where: {} });
		await User.destroy({ where: {} });
		await Galaxy.destroy({ where: {} });
	});

	describe('User and UserState Relations', () => {
		test('should create user with user state and maintain referential integrity', async () => {
			// Создаем пользователя
			const user = await User.create({
				telegramId: 123456,
				username: 'testuser',
				firstName: 'Test',
				lastName: 'User',
			});

			// Создаем состояние пользователя
			const userState = await UserState.create({
				userId: user.id,
				level: 1,
				experience: 0,
				balance: 100,
				currency: 'TON',
			});

			// Проверяем связь
			const userWithState = await User.findByPk(user.id, {
				include: [{ model: UserState, as: 'userState' }],
			});

			expect(userWithState.userState).toBeDefined();
			expect(userWithState.userState.userId).toBe(user.id);
			expect(userWithState.userState.level).toBe(1);
		});

		test('should handle cascade operations correctly', async () => {
			// Создаем пользователя с состоянием
			const user = await User.create({
				telegramId: 123456,
				username: 'testuser',
				firstName: 'Test',
				lastName: 'User',
			});

			await UserState.create({
				userId: user.id,
				level: 1,
				experience: 0,
				balance: 100,
				currency: 'TON',
			});

			// Удаляем пользователя
			await user.destroy();

			// Проверяем, что состояние тоже удалено
			const userState = await UserState.findOne({
				where: { userId: user.id },
			});
			expect(userState).toBeNull();
		});
	});

	describe('Task and TaskTemplate Relations', () => {
		test('should create task from template and maintain consistency', async () => {
			// Создаем шаблон задачи
			const template = await TaskTemplate.create({
				name: 'Test Task',
				description: 'Test Description',
				type: 'exploration',
				difficulty: 1,
				experienceReward: 100,
				currencyReward: 50,
				currencyType: 'TON',
				duration: 3600,
				requirements: { minLevel: 1 },
			});

			// Создаем пользователя
			const user = await User.create({
				telegramId: 123456,
				username: 'testuser',
				firstName: 'Test',
				lastName: 'User',
			});

			// Создаем задачу на основе шаблона
			const task = await Task.create({
				userId: user.id,
				templateId: template.id,
				status: 'assigned',
				assignedAt: new Date(),
				expiresAt: new Date(Date.now() + template.duration * 1000),
			});

			// Проверяем связь
			const taskWithTemplate = await Task.findByPk(task.id, {
				include: [{ model: TaskTemplate, as: 'template' }],
			});

			expect(taskWithTemplate.template).toBeDefined();
			expect(taskWithTemplate.template.name).toBe('Test Task');
			expect(taskWithTemplate.template.experienceReward).toBe(100);
		});
	});

	describe('Market Operations', () => {
		test('should handle market offer lifecycle', async () => {
			// Создаем продавца
			const seller = await User.create({
				telegramId: 111,
				username: 'seller',
				firstName: 'Seller',
				lastName: 'User',
			});

			// Создаем предложение
			const offer = await MarketOffer.create({
				sellerId: seller.id,
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
				status: 'active',
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
			});

			// Проверяем создание
			expect(offer.status).toBe('active');

			// Обновляем статус на "продано"
			await offer.update({ status: 'sold' });

			// Проверяем обновление
			const updatedOffer = await MarketOffer.findByPk(offer.id);
			expect(updatedOffer.status).toBe('sold');
		});

		test('should handle expired offers correctly', async () => {
			// Создаем продавца
			const seller = await User.create({
				telegramId: 111,
				username: 'seller',
				firstName: 'Seller',
				lastName: 'User',
			});

			// Создаем просроченное предложение
			const expiredOffer = await MarketOffer.create({
				sellerId: seller.id,
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
				status: 'active',
				expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 часа назад
			});

			// Находим просроченные предложения
			const expiredOffers = await MarketOffer.findAll({
				where: {
					status: 'active',
					expiresAt: {
						[sequelize.Op.lt]: new Date(),
					},
				},
			});

			expect(expiredOffers).toHaveLength(1);
			expect(expiredOffers[0].id).toBe(expiredOffer.id);
		});
	});

	describe('Complex Queries', () => {
		test('should perform complex joins and aggregations', async () => {
			// Создаем пользователей
			const user1 = await User.create({
				telegramId: 111,
				username: 'user1',
				firstName: 'User',
				lastName: 'One',
			});

			const user2 = await User.create({
				telegramId: 222,
				username: 'user2',
				firstName: 'User',
				lastName: 'Two',
			});

			// Создаем состояния пользователей
			await UserState.create({
				userId: user1.id,
				level: 5,
				experience: 1000,
				balance: 500,
				currency: 'TON',
			});

			await UserState.create({
				userId: user2.id,
				level: 3,
				experience: 500,
				balance: 200,
				currency: 'TON',
			});

			// Создаем предложения
			await MarketOffer.create({
				sellerId: user1.id,
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
				status: 'active',
			});

			await MarketOffer.create({
				sellerId: user1.id,
				itemType: 'artifact',
				itemId: 2,
				price: 200,
				currency: 'TON',
				status: 'active',
			});

			await MarketOffer.create({
				sellerId: user2.id,
				itemType: 'artifact',
				itemId: 3,
				price: 150,
				currency: 'TON',
				status: 'sold',
			});

			// Сложный запрос: пользователи с их предложениями и статистикой
			const usersWithOffers = await User.findAll({
				include: [
					{
						model: UserState,
						as: 'userState',
					},
					{
						model: MarketOffer,
						as: 'offers',
						where: { status: 'active' },
						required: false,
					},
				],
				order: [['id', 'ASC']],
			});

			expect(usersWithOffers).toHaveLength(2);
			expect(usersWithOffers[0].offers).toHaveLength(2); // user1 имеет 2 активных предложения
			expect(usersWithOffers[1].offers).toHaveLength(0); // user2 не имеет активных предложений
		});
	});
});
