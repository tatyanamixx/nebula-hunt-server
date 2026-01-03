const request = require('supertest');
const express = require('express');
const taskRouter = require('../../routes/task-router');
const taskController = require('../../controllers/task-controller');

// Мокаем middleware
jest.mock('../../middlewares/auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/telegram-auth-middleware', () =>
	jest.fn((req, res, next) => {
		// Добавляем данные Telegram в запрос для тестов
		req.user = {
			id: 123456789,
			username: 'testuser',
		};
		next();
	})
);
jest.mock('../../middlewares/admin-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/rate-limit-middleware', () =>
	jest.fn(() => (req, res, next) => next())
);

// Мокаем контроллер
jest.mock('../../controllers/task-controller', () => ({
	getUserTasks: jest.fn((req, res) =>
		res.status(200).json([{ id: 1, taskId: 'task1' }])
	),
	getActiveTasks: jest.fn((req, res) =>
		res.status(200).json([{ id: 1, taskId: 'task1', active: true }])
	),
	getUserTask: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			taskId: req.params.taskId,
			title: { en: 'Test Task' },
		})
	),
	completeTask: jest.fn((req, res) =>
		res.status(200).json({
			task: { id: 1, taskId: req.params.taskId, completed: true },
			reward: 100,
			rewardType: 'stardust',
		})
	),
	completeTask: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			slug: req.params.slug,
			completed: true,
		})
	),

}));

describe('Task Router', () => {
	let app;
	let authMiddleware;
	let telegramAuthMiddleware;
	let adminAuthMiddleware;

	beforeEach(() => {
		// Получаем моки middleware
		authMiddleware = require('../../middlewares/auth-middleware');
		telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
		adminAuthMiddleware = require('../../middlewares/admin-auth-middleware');

		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем экземпляр Express приложения
		app = express();
		app.use(express.json());
		app.use('/tasks', taskRouter);
	});

	describe('GET /tasks', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/tasks');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.getUserTasks).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toBeInstanceOf(Array);
			expect(response.body[0]).toHaveProperty('taskId', 'task1');
		});
	});

	describe('GET /tasks/active', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/tasks/active');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.getActiveTasks).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toBeInstanceOf(Array);
			expect(response.body[0]).toHaveProperty('taskId', 'task1');
			expect(response.body[0]).toHaveProperty('active', true);
		});
	});

	describe('GET /tasks/:taskId', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/tasks/task123');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.getUserTask).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('taskId', 'task123');
			expect(response.body).toHaveProperty('title');
		});
	});

	describe('POST /tasks/:taskId/complete', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/tasks/task123/complete');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.completeTask).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('task');
			expect(response.body.task).toHaveProperty('taskId', 'task123');
			expect(response.body.task).toHaveProperty('completed', true);
			expect(response.body).toHaveProperty('reward', 100);
			expect(response.body).toHaveProperty('rewardType', 'stardust');
		});
	});

	describe('POST /tasks/:slug/complete', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/tasks/task123/complete');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.completeTask).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('slug', 'task123');
			expect(response.body).toHaveProperty('completed', true);
		});
	});


});
