const eventController = require('../../controllers/event-controller');
const eventService = require('../../service/event-service');
const ApiError = require('../../exceptions/api-error');

// Мокаем модули
jest.mock('../../service/event-service');
jest.mock('../../exceptions/api-error', () => ({
	BadRequest: jest.fn((message) => ({ message, status: 400 })),
	NotFound: jest.fn((message) => ({ message, status: 404 })),
	Internal: jest.fn((message) => ({ message, status: 500 })),
}));

describe('EventController', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		req = {
			body: {},
			params: {},
			user: { id: 1 },
		};
		res = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};
		next = jest.fn();
		jest.clearAllMocks();
	});

	describe('getActiveEvents', () => {
		it('should return active events successfully', async () => {
			// Подготавливаем тестовые данные
			const mockEvents = [
				{
					id: 1,
					userId: 1,
					eventId: 'event1',
					status: 'ACTIVE',
					eventTemplate: {
						id: 'event1',
						name: 'Test Event 1',
					},
				},
			];

			// Мокаем сервис
			eventService.getActiveEvents.mockResolvedValue(mockEvents);

			// Вызываем тестируемый метод
			await eventController.getActiveEvents(req, res, next);

			// Проверяем результат
			expect(eventService.getActiveEvents).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).toHaveBeenCalledWith(mockEvents);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle service errors', async () => {
			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.getActiveEvents.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.getActiveEvents(req, res, next);

			// Проверяем результат
			expect(eventService.getActiveEvents).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getUserEvents', () => {
		it('should return all user events successfully', async () => {
			// Подготавливаем тестовые данные
			const mockEvents = {
				active: [
					{
						id: 1,
						userId: 1,
						eventId: 'event1',
						status: 'ACTIVE',
					},
				],
				completed: [
					{
						id: 2,
						userId: 1,
						eventId: 'event2',
						status: 'COMPLETED',
					},
				],
				expired: [],
				settings: {
					eventMultipliers: { production: 1.0 },
				},
			};

			// Мокаем сервис
			eventService.getUserEvents.mockResolvedValue(mockEvents);

			// Вызываем тестируемый метод
			await eventController.getUserEvents(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEvents).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).toHaveBeenCalledWith(mockEvents);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle service errors', async () => {
			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.getUserEvents.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.getUserEvents(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEvents).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('checkAndTriggerEvents', () => {
		it('should check and trigger events successfully', async () => {
			// Подготавливаем тестовые данные
			const mockResult = {
				triggeredEvents: [
					{
						id: 1,
						userId: 1,
						eventId: 'event1',
						status: 'ACTIVE',
					},
				],
				activeEvents: [
					{
						id: 2,
						userId: 1,
						eventId: 'event2',
						status: 'ACTIVE',
					},
				],
			};

			// Мокаем сервис
			eventService.checkAndTriggerEvents.mockResolvedValue(mockResult);

			// Вызываем тестируемый метод
			await eventController.checkAndTriggerEvents(req, res, next);

			// Проверяем результат
			expect(eventService.checkAndTriggerEvents).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).toHaveBeenCalledWith(mockResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle service errors', async () => {
			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.checkAndTriggerEvents.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.checkAndTriggerEvents(req, res, next);

			// Проверяем результат
			expect(eventService.checkAndTriggerEvents).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('triggerEvent', () => {
		it('should trigger a specific event successfully', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
			};

			// Мокаем сервис
			eventService.triggerEvent.mockResolvedValue(mockEvent);

			// Вызываем тестируемый метод
			await eventController.triggerEvent(req, res, next);

			// Проверяем результат
			expect(eventService.triggerEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).toHaveBeenCalledWith(mockEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return error if event ID is missing', async () => {
			// Подготавливаем тестовые данные без ID события
			req.params = {};

			// Вызываем тестируемый метод
			await eventController.triggerEvent(req, res, next);

			// Проверяем результат
			expect(eventService.triggerEvent).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Event ID is required',
				})
			);
		});

		it('should handle service errors', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.triggerEvent.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.triggerEvent(req, res, next);

			// Проверяем результат
			expect(eventService.triggerEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('completeEvent', () => {
		it('should complete an event successfully', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'COMPLETED',
			};

			// Мокаем сервис
			eventService.completeEvent.mockResolvedValue(mockEvent);

			// Вызываем тестируемый метод
			await eventController.completeEvent(req, res, next);

			// Проверяем результат
			expect(eventService.completeEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).toHaveBeenCalledWith(mockEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return error if event ID is missing', async () => {
			// Подготавливаем тестовые данные без ID события
			req.params = {};

			// Вызываем тестируемый метод
			await eventController.completeEvent(req, res, next);

			// Проверяем результат
			expect(eventService.completeEvent).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Event ID is required',
				})
			);
		});

		it('should handle service errors', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.completeEvent.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.completeEvent(req, res, next);

			// Проверяем результат
			expect(eventService.completeEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('cancelEvent', () => {
		it('should cancel an event successfully', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'CANCELLED',
			};

			// Мокаем сервис
			eventService.cancelEvent.mockResolvedValue(mockEvent);

			// Вызываем тестируемый метод
			await eventController.cancelEvent(req, res, next);

			// Проверяем результат
			expect(eventService.cancelEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).toHaveBeenCalledWith(mockEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return error if event ID is missing', async () => {
			// Подготавливаем тестовые данные без ID события
			req.params = {};

			// Вызываем тестируемый метод
			await eventController.cancelEvent(req, res, next);

			// Проверяем результат
			expect(eventService.cancelEvent).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Event ID is required',
				})
			);
		});

		it('should handle service errors', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.cancelEvent.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.cancelEvent(req, res, next);

			// Проверяем результат
			expect(eventService.cancelEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getUserEvent', () => {
		it('should return a specific event successfully', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				eventTemplate: {
					id: 'event1',
					name: 'Test Event',
				},
			};

			// Мокаем сервис
			eventService.getUserEvent.mockResolvedValue(mockEvent);

			// Вызываем тестируемый метод
			await eventController.getUserEvent(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).toHaveBeenCalledWith(mockEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return error if event ID is missing', async () => {
			// Подготавливаем тестовые данные без ID события
			req.params = {};

			// Вызываем тестируемый метод
			await eventController.getUserEvent(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEvent).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Event ID is required',
				})
			);
		});

		it('should handle service errors', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			req.params = { eventId };

			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.getUserEvent.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.getUserEvent(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEvent).toHaveBeenCalledWith(
				req.user.id,
				eventId
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getUserEventSettings', () => {
		it('should return user event settings successfully', async () => {
			// Подготавливаем тестовые данные
			const mockSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: { production: 1.0 },
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: [],
			};

			// Мокаем сервис
			eventService.getUserEventSettings.mockResolvedValue(mockSettings);

			// Вызываем тестируемый метод
			await eventController.getUserEventSettings(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEventSettings).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).toHaveBeenCalledWith(mockSettings);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle service errors', async () => {
			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.getUserEventSettings.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.getUserEventSettings(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEventSettings).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateUserEventSettings', () => {
		it('should update user event settings successfully', async () => {
			// Подготавливаем тестовые данные
			const settingsData = {
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: ['event3'],
			};
			req.body = settingsData;

			const mockSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: { production: 1.0 },
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: ['event3'],
			};

			// Мокаем сервис
			eventService.updateUserEventSettings.mockResolvedValue(
				mockSettings
			);

			// Вызываем тестируемый метод
			await eventController.updateUserEventSettings(req, res, next);

			// Проверяем результат
			expect(eventService.updateUserEventSettings).toHaveBeenCalledWith(
				req.user.id,
				settingsData
			);
			expect(res.json).toHaveBeenCalledWith(mockSettings);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return error if settings data is missing', async () => {
			// Подготавливаем тестовые данные без данных настроек
			req.body = null;

			// Вызываем тестируемый метод
			await eventController.updateUserEventSettings(req, res, next);

			// Проверяем результат
			expect(eventService.updateUserEventSettings).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Settings data is required',
				})
			);
		});

		it('should handle service errors', async () => {
			// Подготавливаем тестовые данные
			const settingsData = {
				enabledTypes: ['RANDOM', 'PERIODIC'],
			};
			req.body = settingsData;

			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.updateUserEventSettings.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.updateUserEventSettings(req, res, next);

			// Проверяем результат
			expect(eventService.updateUserEventSettings).toHaveBeenCalledWith(
				req.user.id,
				settingsData
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getUserEventStats', () => {
		it('should return user event statistics successfully', async () => {
			// Подготавливаем тестовые данные
			const mockStats = {
				totalEvents: 10,
				activeEvents: 2,
				completedEvents: 5,
				expiredEvents: 3,
				mostCommonType: 'RANDOM',
			};

			// Мокаем сервис
			eventService.getUserEventStats.mockResolvedValue(mockStats);

			// Вызываем тестируемый метод
			await eventController.getUserEventStats(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEventStats).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).toHaveBeenCalledWith(mockStats);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle service errors', async () => {
			// Мокаем сервис с ошибкой
			const error = new Error('Service error');
			eventService.getUserEventStats.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.getUserEventStats(req, res, next);

			// Проверяем результат
			expect(eventService.getUserEventStats).toHaveBeenCalledWith(
				req.user.id
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
