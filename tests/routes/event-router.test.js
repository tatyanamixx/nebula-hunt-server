const request = require('supertest');
const express = require('express');
const eventRouter = require('../../routes/event-router');
const eventController = require('../../controllers/event-controller');

// Мокаем middleware
jest.mock('../../middlewares/auth-middleware', () =>
	jest.fn((req, res, next) => {
		req.user = { id: 1 };
		next();
	})
);
jest.mock('../../middlewares/telegram-auth-middleware', () =>
	jest.fn((req, res, next) => {
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
jest.mock('../../controllers/event-controller', () => ({
	getActiveEvents: jest.fn((req, res) =>
		res.status(200).json([
			{
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
			},
		])
	),
	getUserEvents: jest.fn((req, res) =>
		res.status(200).json({
			active: [{ id: 1, status: 'ACTIVE' }],
			completed: [{ id: 2, status: 'COMPLETED' }],
			expired: [],
			settings: { eventMultipliers: { production: 1.0 } },
		})
	),
	checkAndTriggerEvents: jest.fn((req, res) =>
		res.status(200).json({
			triggeredEvents: [{ id: 3, status: 'ACTIVE' }],
			activeEvents: [{ id: 1, status: 'ACTIVE' }],
		})
	),
	triggerEvent: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			userId: 1,
			eventId: req.params.eventId,
			status: 'ACTIVE',
		})
	),
	completeEvent: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			userId: 1,
			eventId: req.params.eventId,
			status: 'COMPLETED',
		})
	),
	cancelEvent: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			userId: 1,
			eventId: req.params.eventId,
			status: 'CANCELLED',
		})
	),
	getUserEvent: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			userId: 1,
			eventId: req.params.eventId,
			status: 'ACTIVE',
		})
	),
	getUserEventSettings: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			userId: 1,
			eventMultipliers: { production: 1.0 },
		})
	),
	updateUserEventSettings: jest.fn((req, res) =>
		res.status(200).json({
			id: 1,
			userId: 1,
			eventMultipliers: { production: 1.0 },
			...req.body,
		})
	),
	getUserEventStats: jest.fn((req, res) =>
		res.status(200).json({
			totalEvents: 10,
			activeEvents: 2,
			completedEvents: 5,
			expiredEvents: 3,
		})
	),
}));

describe('Event Router', () => {
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
		app.use('/events', eventRouter);
	});

	describe('GET /events', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/events');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			// Не проверяем rateLimitMiddleware, так как это фабрика middleware

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.getUserEvents).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('active');
			expect(response.body).toHaveProperty('completed');
			expect(response.body).toHaveProperty('settings');
		});
	});

	describe('GET /events/active', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/events/active');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.getActiveEvents).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body[0]).toHaveProperty('id', 1);
			expect(response.body[0]).toHaveProperty('status', 'ACTIVE');
		});
	});

	describe('POST /events/check', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/events/check');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.checkAndTriggerEvents).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('triggeredEvents');
			expect(response.body).toHaveProperty('activeEvents');
		});
	});

	describe('GET /events/settings', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/events/settings');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.getUserEventSettings).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('id', 1);
			expect(response.body).toHaveProperty('eventMultipliers');
		});
	});

	describe('PUT /events/settings', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const settingsData = {
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: ['event3'],
			};

			// Выполняем запрос
			const response = await request(app)
				.put('/events/settings')
				.send(settingsData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.updateUserEventSettings).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('enabledTypes');
			expect(response.body.enabledTypes).toEqual(
				settingsData.enabledTypes
			);
			expect(response.body).toHaveProperty('disabledEvents');
			expect(response.body.disabledEvents).toEqual(
				settingsData.disabledEvents
			);
		});
	});

	describe('GET /events/stats', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/events/stats');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.getUserEventStats).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('totalEvents');
			expect(response.body).toHaveProperty('activeEvents');
			expect(response.body).toHaveProperty('completedEvents');
		});
	});

	describe('GET /events/:eventId', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/events/event1');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.getUserEvent).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('id', 1);
			expect(response.body).toHaveProperty('eventId', 'event1');
		});
	});

	describe('POST /events/trigger/:eventId', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/events/trigger/event1');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.triggerEvent).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('id', 1);
			expect(response.body).toHaveProperty('eventId', 'event1');
			expect(response.body).toHaveProperty('status', 'ACTIVE');
		});
	});

	describe('POST /events/complete/:eventId', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/events/complete/event1');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.completeEvent).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('id', 1);
			expect(response.body).toHaveProperty('eventId', 'event1');
			expect(response.body).toHaveProperty('status', 'COMPLETED');
		});
	});

	describe('POST /events/cancel/:eventId', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/events/cancel/event1');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(eventController.cancelEvent).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('id', 1);
			expect(response.body).toHaveProperty('eventId', 'event1');
			expect(response.body).toHaveProperty('status', 'CANCELLED');
		});
	});
});
