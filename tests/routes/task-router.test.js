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
		req.initdata = {
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
	getUserTasks: jest.fn((req, res) => res.status(200).json({ tasks: [] })),
	getUserTask: jest.fn((req, res) =>
		res.status(200).json({ id: req.params.taskId, title: 'Test Task' })
	),
	completeTask: jest.fn((req, res) =>
		res.status(200).json({ success: true, task: { id: req.body.taskId } })
	),
	updateTaskProgress: jest.fn((req, res) =>
		res.status(200).json({
			success: true,
			task: {
				id: req.body.taskId,
				progress: req.body.progress,
			},
		})
	),
	getTaskProgress: jest.fn((req, res) =>
		res.status(200).json({
			taskId: req.params.taskId,
			progress: 50,
			targetProgress: 100,
		})
	),
	initializeUserTasks: jest.fn((req, res) =>
		res.status(200).json({ tasks: [] })
	),
	getUserTaskStats: jest.fn((req, res) =>
		res.status(200).json({
			total: 10,
			completed: 5,
			active: 5,
			overallProgress: 50,
		})
	),
}));

describe('Task Router', () => {
	let app;
	let authMiddleware;
	let telegramAuthMiddleware;
	let adminMiddleware;

	beforeEach(() => {
		// Получаем моки middleware
		authMiddleware = require('../../middlewares/auth-middleware');
		telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
		adminMiddleware = require('../../middlewares/admin-middleware');

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
			expect(response.body).toHaveProperty('tasks');
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
			expect(response.body).toHaveProperty('id', 'task123');
			expect(response.body).toHaveProperty('title', 'Test Task');
		});
	});

	describe('POST /tasks/complete', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				taskId: 'task123',
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/tasks/complete')
				.send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.completeTask).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.task).toHaveProperty('id', 'task123');
		});
	});

	describe('POST /tasks/progress', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				taskId: 'task123',
				progress: 25,
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/tasks/progress')
				.send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.updateTaskProgress).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.task).toHaveProperty('id', 'task123');
			expect(response.body.task).toHaveProperty('progress', 25);
		});
	});

	describe('GET /tasks/progress/:taskId', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/tasks/progress/task123');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.getTaskProgress).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('taskId', 'task123');
			expect(response.body).toHaveProperty('progress', 50);
			expect(response.body).toHaveProperty('targetProgress', 100);
		});
	});

	describe('POST /tasks/initialize', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/tasks/initialize');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.initializeUserTasks).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('tasks');
		});
	});

	describe('GET /tasks/stats', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/tasks/stats');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(taskController.getUserTaskStats).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('total', 10);
			expect(response.body).toHaveProperty('completed', 5);
			expect(response.body).toHaveProperty('active', 5);
			expect(response.body).toHaveProperty('overallProgress', 50);
		});
	});
});
