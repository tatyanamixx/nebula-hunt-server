const eventTemplateService = require('../../service/event-template-service');
const { EventTemplate } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');

// Mock the models
jest.mock('../../models/models', () => {
	return {
		EventTemplate: {
			findOne: jest.fn(),
			findAll: jest.fn(),
			findByPk: jest.fn(),
			create: jest.fn(),
		},
	};
});

describe('EventTemplateService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createEvents', () => {
		it('should create new event templates', async () => {
			// Mock data
			const events = [
				{
					id: 'event1',
					name: 'Test Event 1',
					description: {
						en: 'Test Description 1',
						ru: 'Тест Описание 1',
					},
					type: 'RANDOM',
					effect: { multipliers: { production: 1.5 } },
					active: true,
				},
				{
					id: 'event2',
					name: 'Test Event 2',
					description: {
						en: 'Test Description 2',
						ru: 'Тест Описание 2',
					},
					type: 'PERIODIC',
					effect: { multipliers: { stability: 1.2 } },
					active: true,
				},
			];

			// Mock findOne to return null (no existing events)
			EventTemplate.findOne.mockResolvedValue(null);

			// Mock create to return the event
			EventTemplate.create.mockImplementation((eventData) =>
				Promise.resolve({
					...eventData,
					toJSON: () => eventData,
				})
			);

			// Call the service method
			const result = await eventTemplateService.createEvents(events);

			// Assertions
			expect(EventTemplate.findOne).toHaveBeenCalledTimes(4); // 2 events, 2 calls each (id and name)
			expect(EventTemplate.create).toHaveBeenCalledTimes(2);
			expect(result.events.length).toBe(2);
			expect(result.events[0].id).toBe('event1');
			expect(result.events[1].id).toBe('event2');
		});

		it('should update existing event templates', async () => {
			// Mock data
			const events = [
				{
					id: 'event1',
					name: 'Updated Event 1',
					description: {
						en: 'Updated Description 1',
						ru: 'Обновленное Описание 1',
					},
					type: 'RANDOM',
					effect: { multipliers: { production: 2.0 } },
					active: true,
				},
			];

			// Mock existing event
			const mockExistingEvent = {
				id: 'event1',
				name: 'Test Event 1',
				update: jest.fn().mockImplementation(function (data) {
					Object.assign(this, data);
					return Promise.resolve(this);
				}),
				toJSON: function () {
					return this;
				},
			};

			// Mock findOne to return the existing event
			EventTemplate.findOne.mockResolvedValue(mockExistingEvent);

			// Call the service method
			const result = await eventTemplateService.createEvents(events);

			// Assertions
			expect(EventTemplate.findOne).toHaveBeenCalledTimes(1);
			expect(mockExistingEvent.update).toHaveBeenCalledTimes(1);
			expect(result.events.length).toBe(1);
			expect(result.events[0].name).toBe('Updated Event 1');
		});

		it('should handle errors', async () => {
			// Mock data
			const events = [{ id: 'event1' }];

			// Mock error
			EventTemplate.findOne.mockRejectedValue(
				new Error('Database error')
			);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.createEvents(events)
			).rejects.toThrow(ApiError);
		});
	});

	describe('updateEvent', () => {
		it('should update an event template', async () => {
			// Mock data
			const eventId = 'event1';
			const eventData = {
				name: 'Updated Event',
				description: {
					en: 'Updated Description',
					ru: 'Обновленное Описание',
				},
			};

			// Mock existing event
			const mockEvent = {
				id: eventId,
				name: 'Original Event',
				update: jest.fn().mockImplementation(function (data) {
					Object.assign(this, data);
					return Promise.resolve(this);
				}),
			};

			// Mock findByPk to return the event
			EventTemplate.findByPk.mockResolvedValue(mockEvent);

			// Call the service method
			const result = await eventTemplateService.updateEvent(
				eventId,
				eventData
			);

			// Assertions
			expect(EventTemplate.findByPk).toHaveBeenCalledWith(eventId);
			expect(mockEvent.update).toHaveBeenCalledWith(eventData);
			expect(result.name).toBe('Updated Event');
		});

		it('should throw error if event not found', async () => {
			// Mock findByPk to return null
			EventTemplate.findByPk.mockResolvedValue(null);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.updateEvent('nonexistent', {})
			).rejects.toThrow('Event template not found');
		});

		it('should handle errors', async () => {
			// Mock findByPk to throw error
			EventTemplate.findByPk.mockRejectedValue(
				new Error('Database error')
			);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.updateEvent('event1', {})
			).rejects.toThrow(ApiError);
		});
	});

	describe('getAllEvents', () => {
		it('should return all event templates', async () => {
			// Mock data
			const mockEvents = [
				{ id: 'event1', name: 'Event 1' },
				{ id: 'event2', name: 'Event 2' },
			];

			// Mock findAll to return events
			EventTemplate.findAll.mockResolvedValue(mockEvents);

			// Call the service method
			const result = await eventTemplateService.getAllEvents();

			// Assertions
			expect(EventTemplate.findAll).toHaveBeenCalledWith({
				order: [['id', 'ASC']],
			});
			expect(result).toEqual(mockEvents);
			expect(result.length).toBe(2);
		});

		it('should handle errors', async () => {
			// Mock findAll to throw error
			EventTemplate.findAll.mockRejectedValue(
				new Error('Database error')
			);

			// Call the service method and expect it to throw
			await expect(eventTemplateService.getAllEvents()).rejects.toThrow(
				ApiError
			);
		});
	});

	describe('getEvent', () => {
		it('should return an event template by ID', async () => {
			// Mock data
			const eventId = 'event1';
			const mockEvent = { id: eventId, name: 'Test Event' };

			// Mock findByPk to return the event
			EventTemplate.findByPk.mockResolvedValue(mockEvent);

			// Call the service method
			const result = await eventTemplateService.getEvent(eventId);

			// Assertions
			expect(EventTemplate.findByPk).toHaveBeenCalledWith(eventId);
			expect(result).toEqual(mockEvent);
		});

		it('should throw error if event not found', async () => {
			// Mock findByPk to return null
			EventTemplate.findByPk.mockResolvedValue(null);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.getEvent('nonexistent')
			).rejects.toThrow('Event template not found');
		});

		it('should handle errors', async () => {
			// Mock findByPk to throw error
			EventTemplate.findByPk.mockRejectedValue(
				new Error('Database error')
			);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.getEvent('event1')
			).rejects.toThrow(ApiError);
		});
	});

	describe('deleteEvent', () => {
		it('should delete an event template', async () => {
			// Mock data
			const eventId = 'event1';
			const mockEvent = {
				id: eventId,
				name: 'Test Event',
				destroy: jest.fn().mockResolvedValue(true),
			};

			// Mock findByPk to return the event
			EventTemplate.findByPk.mockResolvedValue(mockEvent);

			// Call the service method
			const result = await eventTemplateService.deleteEvent(eventId);

			// Assertions
			expect(EventTemplate.findByPk).toHaveBeenCalledWith(eventId);
			expect(mockEvent.destroy).toHaveBeenCalled();
			expect(result).toEqual({
				message: 'Event template deleted successfully',
				id: eventId,
			});
		});

		it('should throw error if event not found', async () => {
			// Mock findByPk to return null
			EventTemplate.findByPk.mockResolvedValue(null);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.deleteEvent('nonexistent')
			).rejects.toThrow('Event template not found');
		});

		it('should handle errors', async () => {
			// Mock findByPk to throw error
			EventTemplate.findByPk.mockRejectedValue(
				new Error('Database error')
			);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.deleteEvent('event1')
			).rejects.toThrow(ApiError);
		});
	});

	describe('toggleEventActive', () => {
		it('should toggle event active status from true to false', async () => {
			// Mock data
			const eventId = 'event1';
			const mockEvent = {
				id: eventId,
				name: 'Test Event',
				active: true,
				save: jest.fn().mockResolvedValue(true),
			};

			// Mock findByPk to return the event
			EventTemplate.findByPk.mockResolvedValue(mockEvent);

			// Call the service method
			const result = await eventTemplateService.toggleEventActive(
				eventId
			);

			// Assertions
			expect(EventTemplate.findByPk).toHaveBeenCalledWith(eventId);
			expect(mockEvent.active).toBe(false);
			expect(mockEvent.save).toHaveBeenCalled();
			expect(result).toEqual(mockEvent);
		});

		it('should toggle event active status from false to true', async () => {
			// Mock data
			const eventId = 'event1';
			const mockEvent = {
				id: eventId,
				name: 'Test Event',
				active: false,
				save: jest.fn().mockResolvedValue(true),
			};

			// Mock findByPk to return the event
			EventTemplate.findByPk.mockResolvedValue(mockEvent);

			// Call the service method
			const result = await eventTemplateService.toggleEventActive(
				eventId
			);

			// Assertions
			expect(EventTemplate.findByPk).toHaveBeenCalledWith(eventId);
			expect(mockEvent.active).toBe(true);
			expect(mockEvent.save).toHaveBeenCalled();
			expect(result).toEqual(mockEvent);
		});

		it('should throw error if event not found', async () => {
			// Mock findByPk to return null
			EventTemplate.findByPk.mockResolvedValue(null);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.toggleEventActive('nonexistent')
			).rejects.toThrow('Event template not found');
		});

		it('should handle errors', async () => {
			// Mock findByPk to throw error
			EventTemplate.findByPk.mockRejectedValue(
				new Error('Database error')
			);

			// Call the service method and expect it to throw
			await expect(
				eventTemplateService.toggleEventActive('event1')
			).rejects.toThrow(ApiError);
		});
	});
});
