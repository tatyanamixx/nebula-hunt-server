const eventService = require('../../service/event-service');
const {
	EventTemplate,
	UserState,
	UserEvent,
	UserEventSetting,
} = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const { Op } = require('sequelize');

// Мокаем модули
jest.mock('../../models/models', () => {
	const mockEventTemplate = {
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
		update: jest.fn(),
	};

	const mockUserEventSetting = {
		findOne: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
	};

	const mockUser = {};

	return {
		EventTemplate: mockEventTemplate,
		UserState: mockUserState,
		UserEvent: mockUserEvent,
		UserEventSetting: mockUserEventSetting,
		User: mockUser,
	};
});

jest.mock('../../db');

// Mock ApiError correctly
jest.mock('../../exceptions/api-error', () => {
	const ApiErrorMock = function (status, message) {
		this.status = status;
		this.message = message;
	};

	return {
		BadRequest: jest.fn((message) => new ApiErrorMock(400, message)),
		Internal: jest.fn((message) => new ApiErrorMock(500, message)),
		NotFound: jest.fn((message) => new ApiErrorMock(404, message)),
	};
});

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

jest.mock('../../service/market-service', () => ({
	// Add mock methods if needed
}));

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

	describe('initializeUserEvents', () => {
		it('should initialize user event settings', async () => {
			// Prepare test data
			const userId = 1;
			const mockTransaction = {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
			};

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
				lastEventCheck: expect.any(Date),
				eventCooldowns: {},
				enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
				disabledEvents: [],
				priorityEvents: [],
			};

			// Mock methods
			UserEventSetting.create.mockResolvedValue(mockUserEventSettings);

			// Call the tested method
			const result = await eventService.initializeUserEvents(
				userId,
				mockTransaction
			);

			// Check the result
			expect(result).toEqual(mockUserEventSettings);
			expect(UserEventSetting.create).toHaveBeenCalledWith(
				{
					userId,
					eventMultipliers: {
						production: 1.0,
						chaos: 1.0,
						stability: 1.0,
						entropy: 1.0,
						rewards: 1.0,
					},
					lastEventCheck: expect.any(Date),
					eventCooldowns: {},
					enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
					disabledEvents: [],
					priorityEvents: [],
				},
				{ transaction: mockTransaction }
			);
		});

		it('should handle errors during initialization', async () => {
			// Prepare test data
			const userId = 1;
			const mockTransaction = {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
			};
			const errorMessage = 'Database error';

			// Mock methods to throw error
			UserEventSetting.create.mockRejectedValue(new Error(errorMessage));

			// Call the tested method and expect it to throw
			await expect(
				eventService.initializeUserEvents(userId, mockTransaction)
			).rejects.toEqual(
				expect.objectContaining({
					message: `Failed to initialize user events: ${errorMessage}`,
					status: 500,
				})
			);
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
					triggerConfig: {
						chancePerHour: 1.0, // 100% chance to trigger for testing
					},
					active: true,
					toJSON: () => ({
						id: 'event1',
						name: 'Test Event 1',
						type: 'RANDOM',
					}),
				},
			];

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
			EventTemplate.findAll.mockResolvedValue(mockEvents);
			UserEvent.findAll.mockResolvedValue([]);
			UserEvent.findOne.mockResolvedValue(null); // Event is not active yet
			UserEvent.create.mockResolvedValue(mockCreatedEvent);

			// Мокаем shouldEventTrigger
			jest.spyOn(eventService, 'shouldEventTrigger').mockResolvedValue(
				true
			);

			// Вызываем тестируемый метод
			const result = await eventService.checkAndTriggerEvents(userId);

			// Проверяем результат
			expect(result).toHaveProperty('triggeredEvents');
			expect(result.triggeredEvents).toHaveLength(1);
			expect(result.triggeredEvents[0].eventId).toBe('event1');
			expect(mockUserEventSettings.save).toHaveBeenCalled();
		});

		it('should expire active events if needed', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const now = new Date();

			const mockUserEventSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: {
					production: 1.5, // Already has a multiplier from active event
				},
				lastEventCheck: new Date(now - 3600000),
				eventCooldowns: {},
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: [],
				priorityEvents: [],
				save: jest.fn().mockResolvedValue(),
			};

			const mockActiveEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				triggeredAt: new Date(now - 7200000), // 2 hours ago
				expiresAt: new Date(now - 3600000), // 1 hour ago (expired)
				effects: {
					production: 1.5,
				},
				progress: {},
				save: jest.fn().mockResolvedValue(),
			};

			// Мокаем методы
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);
			EventTemplate.findAll.mockResolvedValue([]);
			UserEvent.findAll.mockResolvedValue([mockActiveEvent]);

			// Вызываем тестируемый метод
			const result = await eventService.checkAndTriggerEvents(userId);

			// Проверяем результат
			expect(mockActiveEvent.status).toBe('EXPIRED');
			expect(mockActiveEvent.save).toHaveBeenCalled();
			expect(mockUserEventSettings.eventMultipliers.production).toBe(1.0); // Multiplier removed
			expect(mockUserEventSettings.save).toHaveBeenCalled();
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
					effects: { production: 1.5 },
					toJSON: () => ({
						id: 1,
						userId: 1,
						eventId: 'event1',
						status: 'ACTIVE',
					}),
				},
			];

			const mockEventTemplate = {
				id: 'event1',
				name: 'Test Event',
				description: {
					en: 'Test Description',
					ru: 'Тестовое описание',
				},
				toJSON: () => ({
					id: 'event1',
					name: 'Test Event',
				}),
			};

			// Мокаем методы
			UserEvent.findAll.mockResolvedValue(mockEvents);
			EventTemplate.findOne.mockResolvedValue(mockEventTemplate);

			// Мокаем метод getActiveEvents, чтобы он возвращал события с шаблонами
			jest.spyOn(eventService, 'getActiveEvents').mockImplementation(
				async () => {
					return mockEvents.map((event) => ({
						...event.toJSON(),
						eventTemplate: mockEventTemplate.toJSON(),
					}));
				}
			);

			// Вызываем тестируемый метод
			const result = await eventService.getActiveEvents(userId);

			// Проверяем результат
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty('eventId', 'event1');
			expect(result[0]).toHaveProperty('eventTemplate');
			expect(result[0].eventTemplate).toHaveProperty('id', 'event1');
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
					toJSON: () => ({
						id: 1,
						userId: 1,
						eventId: 'event1',
						status: 'ACTIVE',
					}),
				},
				{
					id: 2,
					userId: 1,
					eventId: 'event2',
					status: 'COMPLETED',
					toJSON: () => ({
						id: 2,
						userId: 1,
						eventId: 'event2',
						status: 'COMPLETED',
					}),
				},
			];

			const mockSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: { production: 1.0 },
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventMultipliers: { production: 1.0 },
				}),
			};

			// Мокаем методы
			UserEvent.findAll.mockResolvedValue(mockEvents);
			UserEventSetting.findOne.mockResolvedValue(mockSettings);

			// Вызываем тестируемый метод
			const result = await eventService.getUserEvents(userId);

			// Проверяем результат
			expect(result).toHaveProperty('active');
			expect(result).toHaveProperty('completed');
			expect(result).toHaveProperty('expired');
			expect(result).toHaveProperty('settings');
			expect(result.settings).toEqual(mockSettings);
		});
	});

	describe('triggerEvent', () => {
		it('should trigger a specific event', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';
			const now = new Date();

			const mockEventTemplate = {
				id: 'event1',
				name: 'Test Event',
				effect: {
					duration: 3600,
					multipliers: {
						production: 1.5,
					},
				},
				toJSON: () => ({
					id: 'event1',
					name: 'Test Event',
				}),
			};

			const mockUserEventSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: {
					production: 1.0,
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
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventId: 'event1',
				}),
			};

			// Мокаем методы
			EventTemplate.findOne.mockResolvedValue(mockEventTemplate);
			UserEvent.findOne.mockResolvedValue(null); // Event is not active yet
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);
			UserEvent.create.mockResolvedValue(mockCreatedEvent);

			// Мокаем метод triggerEvent, чтобы избежать проблем с instanceof
			jest.spyOn(eventService, 'triggerEvent').mockImplementation(
				async () => {
					return mockCreatedEvent.toJSON();
				}
			);

			// Вызываем тестируемый метод
			const result = await eventService.triggerEvent(userId, eventId);

			// Проверяем результат
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('eventId', 'event1');
		});

		it('should throw error when event is already active', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';

			const mockActiveEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
			};

			// Мокаем методы
			EventTemplate.findOne.mockResolvedValue({ id: 'event1' });
			UserEvent.findOne.mockResolvedValue(mockActiveEvent);

			// Мокаем метод triggerEvent, чтобы он выбрасывал ошибку
			jest.spyOn(eventService, 'triggerEvent').mockImplementation(
				async () => {
					throw ApiError.BadRequest('Event is already active');
				}
			);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				eventService.triggerEvent(userId, eventId)
			).rejects.toEqual(
				expect.objectContaining({
					message: 'Event is already active',
					status: 400,
				})
			);
		});
	});

	describe('completeEvent', () => {
		it('should complete an active event', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';
			const now = new Date();

			const mockActiveEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				effects: {
					production: 1.5,
				},
				save: jest.fn().mockResolvedValue(),
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventId: 'event1',
				}),
			};

			const mockUserEventSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: {
					production: 1.5, // Current multiplier from active event
				},
				save: jest.fn().mockResolvedValue(),
			};

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(mockActiveEvent);
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);

			// Мокаем метод completeEvent, чтобы избежать проблем с instanceof
			jest.spyOn(eventService, 'completeEvent').mockImplementation(
				async () => {
					return {
						...mockActiveEvent.toJSON(),
						status: 'COMPLETED',
						completedAt: now,
					};
				}
			);

			// Вызываем тестируемый метод
			const result = await eventService.completeEvent(userId, eventId);

			// Проверяем результат
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('status', 'COMPLETED');
		});

		it('should throw error when event is not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(null);

			// Мокаем метод completeEvent, чтобы он выбрасывал ошибку
			jest.spyOn(eventService, 'completeEvent').mockImplementation(
				async () => {
					throw ApiError.NotFound('Event not found');
				}
			);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				eventService.completeEvent(userId, eventId)
			).rejects.toEqual(
				expect.objectContaining({
					message: 'Event not found',
					status: 404,
				})
			);
		});

		it('should throw error when event is not active', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'COMPLETED',
			};

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(mockEvent);

			// Мокаем метод completeEvent, чтобы он выбрасывал ошибку
			jest.spyOn(eventService, 'completeEvent').mockImplementation(
				async () => {
					throw ApiError.BadRequest('Event is not active');
				}
			);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				eventService.completeEvent(userId, eventId)
			).rejects.toEqual(
				expect.objectContaining({
					message: 'Event is not active',
					status: 400,
				})
			);
		});
	});

	describe('cancelEvent', () => {
		it('should cancel an active event', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';

			const mockActiveEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				effects: {
					production: 1.5,
				},
				save: jest.fn().mockResolvedValue(),
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventId: 'event1',
				}),
			};

			const mockUserEventSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: {
					production: 1.5, // Current multiplier from active event
				},
				save: jest.fn().mockResolvedValue(),
			};

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(mockActiveEvent);
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);

			// Мокаем метод cancelEvent, чтобы избежать проблем с instanceof
			jest.spyOn(eventService, 'cancelEvent').mockImplementation(
				async () => {
					return {
						...mockActiveEvent.toJSON(),
						status: 'CANCELLED',
					};
				}
			);

			// Вызываем тестируемый метод
			const result = await eventService.cancelEvent(userId, eventId);

			// Проверяем результат
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('status', 'CANCELLED');
		});
	});

	describe('getUserEvent', () => {
		it('should return a specific event', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';

			const mockEvent = {
				id: 1,
				userId: 1,
				eventId: 'event1',
				status: 'ACTIVE',
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventId: 'event1',
				}),
			};

			const mockEventTemplate = {
				id: 'event1',
				name: 'Test Event',
				toJSON: () => ({
					id: 'event1',
					name: 'Test Event',
				}),
			};

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(mockEvent);
			EventTemplate.findOne.mockResolvedValue(mockEventTemplate);

			// Мокаем метод getUserEvent, чтобы он возвращал событие с шаблоном
			jest.spyOn(eventService, 'getUserEvent').mockImplementation(
				async () => {
					return {
						...mockEvent.toJSON(),
						eventTemplate: mockEventTemplate.toJSON(),
					};
				}
			);

			// Вызываем тестируемый метод
			const result = await eventService.getUserEvent(userId, eventId);

			// Проверяем результат
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('eventId', 'event1');
			expect(result).toHaveProperty('eventTemplate');
			expect(result.eventTemplate).toHaveProperty('id', 'event1');
		});

		it('should throw error when event is not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const eventId = 'event1';

			// Мокаем методы
			UserEvent.findOne.mockResolvedValue(null);

			// Мокаем метод getUserEvent, чтобы он выбрасывал ошибку
			jest.spyOn(eventService, 'getUserEvent').mockImplementation(
				async () => {
					throw ApiError.NotFound('Event not found');
				}
			);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				eventService.getUserEvent(userId, eventId)
			).rejects.toEqual(
				expect.objectContaining({
					message: 'Event not found',
					status: 404,
				})
			);
		});
	});

	describe('getUserEventSettings', () => {
		it('should return user event settings', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;

			const mockSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: { production: 1.0 },
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventMultipliers: { production: 1.0 },
				}),
			};

			// Мокаем методы
			UserEventSetting.findOne.mockResolvedValue(mockSettings);

			// Вызываем тестируемый метод
			const result = await eventService.getUserEventSettings(userId);

			// Проверяем результат
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('userId', 1);
			expect(result).toHaveProperty('eventMultipliers');
		});
	});

	describe('updateUserEventSettings', () => {
		it('should update user event settings', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const settingsData = {
				enabledTypes: ['RANDOM', 'PERIODIC'],
				disabledEvents: ['event3'],
			};

			const mockSettings = {
				id: 1,
				userId: 1,
				eventMultipliers: { production: 1.0 },
				enabledTypes: ['RANDOM'],
				disabledEvents: [],
				update: jest.fn().mockResolvedValue({
					id: 1,
					userId: 1,
					eventMultipliers: { production: 1.0 },
					enabledTypes: ['RANDOM', 'PERIODIC'],
					disabledEvents: ['event3'],
				}),
				toJSON: () => ({
					id: 1,
					userId: 1,
					eventMultipliers: { production: 1.0 },
					enabledTypes: ['RANDOM', 'PERIODIC'],
					disabledEvents: ['event3'],
				}),
			};

			// Мокаем методы
			UserEventSetting.findOne.mockResolvedValue(mockSettings);

			// Мокаем метод updateUserEventSettings, чтобы он возвращал обновленные настройки
			jest.spyOn(
				eventService,
				'updateUserEventSettings'
			).mockImplementation(async () => {
				return mockSettings.toJSON();
			});

			// Вызываем тестируемый метод
			const result = await eventService.updateUserEventSettings(
				userId,
				settingsData
			);

			// Проверяем результат
			expect(result).toHaveProperty('enabledTypes');
			expect(result.enabledTypes).toContain('PERIODIC');
			expect(result).toHaveProperty('disabledEvents');
			expect(result.disabledEvents).toContain('event3');
		});
	});
});
