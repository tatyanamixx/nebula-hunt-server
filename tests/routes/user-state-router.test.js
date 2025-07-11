const request = require('supertest');
const express = require('express');
const userStateRouter = require('../../routes/user-state-router');
const userStateController = require('../../controllers/user-state-controller');

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
jest.mock('../../controllers/user-state-controller', () => ({
	getUserState: jest.fn((req, res) =>
		res.status(200).json({
			userId: req.initdata.id,
			stardust: 100,
			darkMatter: 50,
			tgStars: 25,
		})
	),
	updateUserState: jest.fn((req, res) =>
		res.status(200).json({
			userId: req.initdata.id,
			userState: {
				...req.body,
				stardust: req.body.stardust || 100,
				darkMatter: req.body.darkMatter || 50,
				tgStars: req.body.tgStars || 25,
			},
		})
	),
	getLeaderboard: jest.fn((req, res) =>
		res.status(200).json({
			leaderboard: [
				{ userId: 111111, username: 'user1', stars: 500, rating: 1 },
				{ userId: 222222, username: 'user2', stars: 400, rating: 2 },
				{ userId: 333333, username: 'user3', stars: 300, rating: 3 },
			],
			userRating: 42,
			totalUsers: 100,
		})
	),
}));

describe('UserState Router', () => {
	let app;
	let authMiddleware;
	let telegramAuthMiddleware;
	let rateLimitMiddleware;

	beforeEach(() => {
		// Получаем моки middleware
		authMiddleware = require('../../middlewares/auth-middleware');
		telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
		rateLimitMiddleware = require('../../middlewares/rate-limit-middleware');

		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем экземпляр Express приложения
		app = express();
		app.use(express.json());
		app.use('/state', userStateRouter);
	});

	describe('GET /state', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/state');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(userStateController.getUserState).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('userId', 123456789);
			expect(response.body).toHaveProperty('stardust', 100);
			expect(response.body).toHaveProperty('darkMatter', 50);
			expect(response.body).toHaveProperty('tgStars', 25);
		});
	});

	describe('PUT /state', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				stardust: 150,
				darkMatter: 75,
				tgStars: 30,
			};

			// Выполняем запрос
			const response = await request(app).put('/state').send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(userStateController.updateUserState).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('userId', 123456789);
			expect(response.body.userState).toHaveProperty('stardust', 150);
			expect(response.body.userState).toHaveProperty('darkMatter', 75);
			expect(response.body.userState).toHaveProperty('tgStars', 30);
		});
	});

	describe('GET /state/leaderboard', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/state/leaderboard');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			// Leaderboard endpoint doesn't use authMiddleware
			expect(authMiddleware).not.toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(userStateController.getLeaderboard).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('leaderboard');
			expect(response.body.leaderboard).toHaveLength(3);
			expect(response.body).toHaveProperty('userRating', 42);
			expect(response.body).toHaveProperty('totalUsers', 100);
		});
	});
});
