const request = require('supertest');
const { app } = require('../../../index');
const { User, UserState } = require('../../../models');

describe('User API Integration Tests', () => {
	beforeEach(async () => {
		// Очистка данных перед каждым тестом
		await User.destroy({ where: {} });
		await UserState.destroy({ where: {} });
	});

	describe('POST /api/auth/registration', () => {
		test('should register user and create user state', async () => {
			const userData = {
				telegramId: 123456,
				username: 'testuser',
				firstName: 'Test',
				lastName: 'User',
			};

			const response = await request(app)
				.post('/api/auth/registration')
				.send(userData)
				.expect(201);

			expect(response.body).toHaveProperty('user');
			expect(response.body).toHaveProperty('userState');
			expect(response.body.user.telegramId).toBe(userData.telegramId);
			expect(response.body.user.username).toBe(userData.username);

			// Проверяем, что данные действительно сохранены в БД
			const user = await User.findByPk(response.body.user.id);
			const userState = await UserState.findOne({
				where: { userId: response.body.user.id },
			});

			expect(user).toBeTruthy();
			expect(userState).toBeTruthy();
			expect(userState.level).toBe(1);
			expect(userState.experience).toBe(0);
		});

		test('should not register duplicate telegram user', async () => {
			const userData = {
				telegramId: 123456,
				username: 'testuser',
				firstName: 'Test',
				lastName: 'User',
			};

			// Первая регистрация
			await request(app)
				.post('/api/auth/registration')
				.send(userData)
				.expect(201);

			// Вторая регистрация с тем же telegramId
			const response = await request(app)
				.post('/api/auth/registration')
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty('error');
		});
	});

	describe('GET /api/auth/friends', () => {
		test('should get user friends with authentication', async () => {
			// Создаем пользователя
			const user = await User.create({
				telegramId: 123456,
				username: 'testuser',
				firstName: 'Test',
				lastName: 'User',
			});

			const response = await request(app)
				.get('/api/auth/friends')
				.set('Authorization', `Bearer ${user.id}`) // Упрощенная авторизация для тестов
				.expect(200);

			expect(response.body).toBeDefined();
		});

		test('should return 401 without authentication', async () => {
			await request(app).get('/api/auth/friends').expect(401);
		});
	});
});
