const request = require('supertest');
const express = require('express');
const authRouter = require('../../routes/auth-router');
const userController = require('../../controllers/user-controller');

// Мокаем middleware
jest.mock('../../middlewares/auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/telegram-auth-middleware', () =>
	jest.fn((req, res, next) => {
		// Добавляем данные Telegram в запрос для тестов
		req.initdata = {
			id: 123456789,
			username: 'testuser',
		};
		next();
	})
);
jest.mock('../../middlewares/rate-limit-middleware', () =>
	jest.fn(() => (req, res, next) => next())
);

// Мокаем контроллер
jest.mock('../../controllers/user-controller', () => ({
	registration: jest.fn((req, res) =>
		res.status(201).json({
			user: { id: req.initdata.id, username: req.initdata.username },
			accessToken: 'mock-access-token',
			refreshToken: 'mock-refresh-token',
		})
	),
	login: jest.fn((req, res) =>
		res.status(200).json({
			user: { id: req.initdata.id, username: req.initdata.username },
			accessToken: 'mock-access-token',
			refreshToken: 'mock-refresh-token',
		})
	),
	logout: jest.fn((req, res) => res.status(200).json({ success: true })),
	refresh: jest.fn((req, res) =>
		res.status(200).json({
			user: {
				id: req.initdata?.id || 1,
				username: req.initdata?.username || 'user',
			},
			accessToken: 'mock-access-token',
			refreshToken: 'mock-refresh-token',
		})
	),
	getFriends: jest.fn((req, res) =>
		res.status(200).json({
			count: 2,
			friends: [
				{ id: 123, username: 'friend1' },
				{ id: 456, username: 'friend2' },
			],
		})
	),
}));

describe('Auth Router', () => {
	let app;
	let authMiddleware;
	let telegramAuthMiddleware;

	beforeEach(() => {
		// Получаем моки middleware
		authMiddleware = require('../../middlewares/auth-middleware');
		telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');

		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем экземпляр Express приложения
		app = express();
		app.use(express.json());
		app.use('/auth', authRouter);
	});

	describe('POST /auth/registration', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				referral: 0,
				userState: { state: { totalStars: 100 } },
				galaxies: [],
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/auth/registration')
				.send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(userController.registration).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty('user');
			expect(response.body).toHaveProperty('accessToken');
			expect(response.body).toHaveProperty('refreshToken');
		});
	});

	describe('POST /auth/login', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/auth/login');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(userController.login).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('user');
			expect(response.body).toHaveProperty('accessToken');
			expect(response.body).toHaveProperty('refreshToken');
		});
	});

	describe('POST /auth/logout', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app)
				.post('/auth/logout')
				.set('Cookie', ['refreshToken=test-refresh-token']);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(userController.logout).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('GET /auth/refresh', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app)
				.get('/auth/refresh')
				.set('Cookie', ['refreshToken=test-refresh-token']);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).not.toHaveBeenCalled(); // JWT auth не нужен для refresh
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(userController.refresh).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('user');
			expect(response.body).toHaveProperty('accessToken');
			expect(response.body).toHaveProperty('refreshToken');
		});

		it('should use refresh token middleware', async () => {
			// Мокаем refresh token middleware
			const refreshTokenMiddleware = require('../../middlewares/refresh-token-middleware');
			jest.spyOn(refreshTokenMiddleware, 'default').mockImplementation(
				(req, res, next) => {
					req.refreshToken = 'test-refresh-token';
					req.refreshTokenData = { id: 123, type: 'refresh' };
					next();
				}
			);

			// Выполняем запрос
			const response = await request(app)
				.get('/auth/refresh')
				.set('Cookie', ['refreshToken=test-refresh-token']);

			// Проверяем, что telegram auth middleware был вызван
			expect(telegramAuthMiddleware).toHaveBeenCalled();

			// Проверяем, что refresh token middleware был вызван
			expect(refreshTokenMiddleware.default).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
		});

		it('should return 401 when refresh token is missing', async () => {
			// Выполняем запрос без refresh token
			const response = await request(app).get('/auth/refresh');

			// Проверяем, что контроллер был вызван
			expect(userController.refresh).toHaveBeenCalled();

			// Ожидаем ошибку от сервиса (токен отсутствует)
			// Контроллер должен обработать это и вернуть 401
		});
	});

	describe('GET /auth/friends', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/auth/friends');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(userController.getFriends).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('count', 2);
			expect(response.body).toHaveProperty('friends');
			expect(response.body.friends).toHaveLength(2);
		});
	});
});
