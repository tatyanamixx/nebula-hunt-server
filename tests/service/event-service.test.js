const eventService = require('../../service/event-service');
const {
	GameEvent,
	UserState,
	UserEvent,
	UserEventSetting,
} = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const { Op } = require('sequelize');

// Мокаем модули
jest.mock('../../models/models', () => {
	const mockGameEvent = {
		findOne: jest.fn(),
		findAll: jest.fn(),
		create: jest.fn(),
		findByPk: jest.fn(),
	};

	const mockUserState = {
		findOne: jest.fn(),
	};

	const mockUserEvent = {
		findOne: jest.fn(),
		findAll: jest.fn(),
		create: jest.fn(),
		count: jest.fn(),
	};

	const mockUserEventSetting = {
		findOne: jest.fn(),
		create: jest.fn(),
	};

	const mockUser = {};

	return {
		GameEvent: mockGameEvent,
		UserState: mockUserState,
		UserEvent: mockUserEvent,
		UserEventSetting: mockUserEventSetting,
		User: mockUser,
	};
});
jest.mock('../../db');
jest.mock('../../exceptions/api-error', () => ({
	BadRequest: jest.fn().mockImplementation((message) => new Error(message)),
	Internal: jest.fn().mockImplementation((message) => new Error(message)),
	NotFound: jest.fn().mockImplementation((message) => new Error(message)),
}));
jest.mock('sequelize', () => {
	const actualSequelize = jest.requireActual('sequelize');
	return {
		...actualSequelize,
		Op: {
			or: Symbol('or'),
			and: Symbol('and'),
			in: Symbol('in'),
			lte: Symbol('lte'),
			eq: Symbol('eq'),
		},
	};
});

describe('EventService', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Мок для транзакции
		sequelize.transaction.mockImplementation(() => {
			return {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
			};
		});
	});

	describe('createEvents', () => {
		it('should create events successfully', async () => {
			// Подготавливаем тестовые данные
			const events = [
				{
					id: 'event1',
					name: 'Test Event 1',
					description: 'Test Description 1',
					type: 'RANDOM',
					effect: {
						duration: 3600,
						multipliers: {
							production: 1.5,
						},
					},
				},
			];

			// Мокаем методы
			GameEvent.findOne.mockResolvedValue(null);
			GameEvent.create.mockResolvedValue({
				id: 'event1',
				name: 'Test Event 1',
			});

			// Вызываем тестируемый метод
			const result = await eventService.createEvents(events);

			// Проверяем результат
			expect(result).toHaveProperty('events');
			expect(result.events).toHaveLength(1);
			expect(GameEvent.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'event1',
					name: 'Test Event 1',
				})
			);
		});

		it('should update existing event if found', async () => {
			// Подготавливаем тестовые данные
			const events = [
				{
					id: 'event1',
					name: 'Test Event 1',
					description: 'Updated Description',
				},
			];

			const existingEvent = {
				id: 'event1',
				name: 'Test Event 1',
				description: 'Old Description',
				update: jest.fn().mockResolvedValue({
					id: 'event1',
					name: 'Test Event 1',
					description: 'Updated Description',
				}),
			};

			// Мокаем методы
			GameEvent.findOne.mockResolvedValue(existingEvent);

			// Вызываем тестируемый метод
			const result = await eventService.createEvents(events);

			// Проверяем результат
			expect(result).toHaveProperty('events');
			expect(result.events).toHaveLength(1);
			expect(existingEvent.update).toHaveBeenCalledWith(events[0]);
		});
	});

	describe('checkAndTriggerEvents', () => {
		it('should check and trigger new events', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const now = new Date();

			const mockUserEventSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: {
					production: 1.0,
					chaos: 1.0,
					stability: 1.0,
					entropy: 1.0,
					rewards: 1.0,
				},
				lastEventCheck: new Date(now - 3600000), // 1 час назад
				eventCooldowns: {},
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: [],
				priorityEvents: [],
				save: jest.fn().mockResolvedValue(),
			};

			const mockEvents = [
				{
					id: 'event1',
					name: 'Test Event 1',
					type: 'RANDOM',
					effect: {
						duration: 3600,
						multipliers: {
							production: 1.5,
						},
					},
					frequency: {
						chancePerSecond: 0.01,
					},
					active: true,
					toJSON: () => ({
						id: 'event1',
						name: 'Test Event 1',
						type: 'RANDOM',
					}),
				},
			];

			const mockUserState = {
				state: {
					ownedEventsCount: 0,
				},
				save: jest.fn().mockResolvedValue(),
			};

			const mockCreatedEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				triggeredAt: now,
				expiresAt: new Date(now.getTime() + 3600000),
				effects: {
					production: 1.5,
				},
				progress: {},
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventId: 'event1',
				}),
			};

			// Мокаем методы
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);
			GameEvent.findAll.mockResolvedValue(mockEvents);
			UserEvent.findAll.mockResolvedValue([]);

			// Мокаем shouldEventTrigger
			jest.spyOn(eventService, 'shouldEventTrigger').mockResolvedValue(
				true
			);

			UserEvent.create.mockResolvedValue(mockCreatedEvent);
			UserState.findOne.mockResolvedValue(mockUserState);
			UserEvent.count.mockResolvedValue(1);

			// Мокаем getActiveEvents
			jest.spyOn(eventService, 'getActiveEvents').mockResolvedValue([
				mockCreatedEvent,
			]);

			// Вызываем тестируемый метод
			const result = await eventService.checkAndTriggerEvents(userId);

			// Проверяем результат
			expect(result).toHaveProperty('activeEvents');
			expect(result).toHaveProperty('eventMultipliers');
			expect(mockUserEventSettings.eventMultipliers.production).toBe(1.5);
			expect(mockUserState.state.ownedEventsCount).toBe(1);
		});

		it('should expire active events if needed', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const now = new Date();

			const mockUserEventSettings = {
				eventMultipliers: {
					production: 1.5,
				},
				lastEventCheck: new Date(now - 3600000),
				eventCooldowns: {},
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: [],
				priorityEvents: [],
				save: jest.fn().mockResolvedValue(),
			};

			const mockActiveEvents = [
				{
					id: 1,
					userId: 1,
					eventId: 'event1',
					status: 'ACTIVE',
					triggeredAt: new Date(now - 7200000),
					expiresAt: new Date(now - 3600000), // Истекло 1 час назад
					effects: {
						production: 1.5,
					},
					save: jest.fn().mockResolvedValue(),
				},
			];

			// Мокаем методы
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);
			GameEvent.findAll.mockResolvedValue([]);
			UserEvent.findAll.mockResolvedValue(mockActiveEvents);

			// Вызываем тестируемый метод
			await eventService.checkAndTriggerEvents(userId);

			// Проверяем результат
			expect(mockActiveEvents[0].status).toBe('EXPIRED');
			expect(mockActiveEvents[0].save).toHaveBeenCalled();
			expect(mockUserEventSettings.eventMultipliers.production).toBe(1.0);
		});
	});

	describe('updateEvent', () => {
		it('should update an event successfully', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'event1';
			const eventData = {
				name: 'Updated Event Name',
				description: 'Updated Description',
				type: 'RANDOM',
				active: true,
			};

			const mockEvent = {
				id: eventId,
				name: 'Old Event Name',
				description: 'Old Description',
				type: 'RANDOM',
				active: true,
				update: jest.fn().mockImplementation(function () {
					this.name = 'Updated Event Name';
					this.description = 'Updated Description';
					return this;
				}),
			};

			// Мокаем методы
			GameEvent.findByPk.mockResolvedValue(mockEvent);

			// Вызываем тестируемый метод
			const result = await eventService.updateEvent(eventId, eventData);

			// Проверяем результат
			expect(result).toHaveProperty('id', eventId);
			expect(result).toHaveProperty('name', 'Updated Event Name');
			expect(mockEvent.update).toHaveBeenCalledWith(eventData);
		});

		it('should throw error when event not found', async () => {
			// Подготавливаем тестовые данные
			const eventId = 'nonexistent';
			const eventData = {
				name: 'Updated Event Name',
			};

			// Мокаем методы
			GameEvent.findByPk.mockResolvedValue(null);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				eventService.updateEvent(eventId, eventData)
			).rejects.toThrow('Event not found');
		});
	});

	describe('getActiveEvents', () => {
		it('should return active events', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;

			const mockEvents = [
				{
					id: 1,
					userId: 1,
					eventId: 'event1',
					status: 'ACTIVE',
					gameevent: {
						id: 'event1',
						name: 'Test Event 1',
					},
				},
			];

			// Мокаем методы
			UserEvent.findAll.mockResolvedValue(mockEvents);

			// Вызываем тестируемый метод
			const result = await eventService.getActiveEvents(userId);

			// Проверяем результат
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty('eventId', 'event1');
			expect(result[0]).toHaveProperty('status', 'ACTIVE');
		});
	});

	describe('getUserEvents', () => {
		it('should return all user events and settings', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;

			const mockEvents = [
				{
					id: 1,
					userId: 1,
					eventId: 'event1',
					status: 'ACTIVE',
					gameevent: {
						id: 'event1',
						name: 'Test Event 1',
					},
				},
				{
					id: 2,
					userId: 1,
					eventId: 'event2',
					status: 'COMPLETED',
					gameevent: {
						id: 'event2',
						name: 'Test Event 2',
					},
				},
			];

			const mockSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: {
					production: 1.0,
				},
			};

			// Мокаем методы
			UserEvent.findAll.mockResolvedValue(mockEvents);
			UserEventSetting.findOne.mockResolvedValue(mockSettings);

			// Вызываем тестируемый метод
			const result = await eventService.getUserEvents(userId);

			// Проверяем результат
			expect(result).toHaveProperty('events');
			expect(result).toHaveProperty('settings');
			expect(result.events).toHaveLength(2);
			expect(result.settings).toEqual(mockSettings);
		});
	});

	describe('updateEventProgress', () => {
		it('should update event progress', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 1;
			const progress = { collected: 50 };

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				progress: { collected: 25 },
				save: jest.fn().mockResolvedValue(),
			};

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(mockEvent);

			// Вызываем тестируемый метод
			await eventService.updateEventProgress(userId, eventId, progress);

			// Проверяем результат
			expect(mockEvent.progress).toEqual({ collected: 50 });
			expect(mockEvent.save).toHaveBeenCalled();
		});
	});

	describe('completeEvent', () => {
		it('should complete event and remove effects', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 1;
			const now = new Date();

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				effects: {
					production: 1.5,
				},
				save: jest.fn().mockResolvedValue(),
			};

			const mockSettings = {
				eventMultipliers: {
					production: 1.5,
				},
				save: jest.fn().mockResolvedValue(),
			};

			const mockUserState = {
				state: {
					ownedEventsCount: 1,
				},
				save: jest.fn().mockResolvedValue(),
			};

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(mockEvent);
			UserEventSetting.findOne.mockResolvedValue(mockSettings);
			UserState.findOne.mockResolvedValue(mockUserState);
			UserEvent.count.mockResolvedValue(0);

			// Вызываем тестируемый метод
			await eventService.completeEvent(userId, eventId);

			// Проверяем результат
			expect(mockEvent.status).toBe('COMPLETED');
			expect(mockEvent.completedAt).toBeInstanceOf(Date);
			expect(mockSettings.eventMultipliers.production).toBe(1.0);
			expect(mockUserState.state.ownedEventsCount).toBe(0);
		});
	});

	describe('initializeUserEvents', () => {
		it('should initialize user event settings', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;

			const mockUserState = {
				state: {
					ownedEventsCount: 0,
				},
				save: jest.fn().mockResolvedValue(),
			};

			// Мокаем методы
			UserEventSetting.findOne.mockResolvedValue(null);
			UserEventSetting.create.mockImplementation((data) => data);
			UserState.findOne.mockResolvedValue(mockUserState);

			// Вызываем тестируемый метод
			const result = await eventService.initializeUserEvents(userId);

			// Проверяем результат
			expect(result).toHaveProperty('userId', 1);
			expect(result).toHaveProperty('eventMultipliers');
			expect(result.eventMultipliers).toHaveProperty('production', 1.0);
			expect(mockUserState.state.ownedEventsCount).toBe(0);
		});
	});
});
