const eventController = require('../../controllers/event-controller');
const eventService = require('../../service/event-service');
const ApiError = require('../../exceptions/api-error');

// Мокаем модули
jest.mock('../../service/event-service');
jest.mock('../../exceptions/api-error', () => ({
	BadRequest: jest.fn().mockImplementation((message) => ({
		message,
		status: 400,
	})),
	NotFound: jest.fn().mockImplementation((message) => ({
		message,
		status: 404,
	})),
}));

describe('EventController', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		req = {
			body: {},
			params: {},
			initdata: { id: 1 },
		};
		res = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};
		next = jest.fn();
		jest.clearAllMocks();
	});

	describe('createEvents', () => {
		it('should create events successfully', async () => {
			// Подготавливаем тестовые данные
			const events = [
				{
					id: 'event1',
					name: 'Test Event 1',
					description: 'Test Description 1',
				},
				{
					id: 'event2',
					name: 'Test Event 2',
					description: 'Test Description 2',
				},
			];
			req.body = events;

			const expectedResult = {
				events: [
					{
						id: 'event1',
						name: 'Test Event 1',
						description: 'Test Description 1',
					},
					{
						id: 'event2',
						name: 'Test Event 2',
						description: 'Test Description 2',
					},
				],
			};

			// Мокаем сервис
			eventService.createEvents.mockResolvedValue(expectedResult);

			// Вызываем тестируемый метод
			await eventController.createEvents(req, res, next);

			// Проверяем результат
			expect(eventService.createEvents).toHaveBeenCalledWith(events);
			expect(res.json).toHaveBeenCalledWith(expectedResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return error if events array is missing', async () => {
			// Подготавливаем тестовые данные без массива событий
			req.body = {};

			// Вызываем тестируемый метод
			await eventController.createEvents(req, res, next);

			// Проверяем результат
			expect(eventService.createEvents).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Invalid request: events array required',
				})
			);
		});

		it('should handle service errors', async () => {
			// Подготавливаем тестовые данные
			const events = [
				{
					id: 'event1',
					name: 'Test Event 1',
				},
			];
			req.body = events;

			const error = new Error('Service error');
			eventService.createEvents.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.createEvents(req, res, next);

			// Проверяем результат
			expect(eventService.createEvents).toHaveBeenCalledWith(events);
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateEvent', () => {
		it('should update an event successfully', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			const eventData = {
				name: 'Updated Event Name',
				description: 'Updated Description',
			};
			req.params = { eventId };
			req.body = eventData;

			const expectedResult = {
				id: eventId,
				name: 'Updated Event Name',
				description: 'Updated Description',
			};

			// Мокаем сервис
			eventService.updateEvent.mockResolvedValue(expectedResult);

			// Вызываем тестируемый метод
			await eventController.updateEvent(req, res, next);

			// Проверяем результат
			expect(eventService.updateEvent).toHaveBeenCalledWith(
				eventId,
				eventData
			);
			expect(res.json).toHaveBeenCalledWith(expectedResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return error if event ID is missing', async () => {
			// Подготавливаем тестовые данные без ID события
			req.params = {};
			req.body = {
				name: 'Updated Event Name',
			};

			// Вызываем тестируемый метод
			await eventController.updateEvent(req, res, next);

			// Проверяем результат
			expect(eventService.updateEvent).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Event ID is required',
				})
			);
		});

		it('should return error if event data is missing', async () => {
			// Подготавливаем тестовые данные без данных события
			req.params = { eventId: 'event1' };
			req.body = null;

			// Вызываем тестируемый метод
			await eventController.updateEvent(req, res, next);

			// Проверяем результат
			expect(eventService.updateEvent).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Event data is required',
				})
			);
		});

		it('should handle service errors', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			const eventData = {
				name: 'Updated Event Name',
			};
			req.params = { eventId };
			req.body = eventData;

			const error = new Error('Service error');
			eventService.updateEvent.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await eventController.updateEvent(req, res, next);

			// Проверяем результат
			expect(eventService.updateEvent).toHaveBeenCalledWith(
				eventId,
				eventData
			);
			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
