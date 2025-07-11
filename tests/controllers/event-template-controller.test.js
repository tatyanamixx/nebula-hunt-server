const eventTemplateController = require('../../controllers/event-template-controller');
const eventTemplateService = require('../../service/event-template-service');
const ApiError = require('../../exceptions/api-error');

// Mock the service
jest.mock('../../service/event-template-service');

describe('EventTemplateController', () => {
	let req, res, next;

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

	describe('createEventTemplate', () => {
		it('should create event template and return result', async () => {
			// Mock data
			const eventData = {
				id: 'event1',
				name: 'Test Event',
				description: { en: 'Test Description', ru: 'Тест Описание' },
				type: 'RANDOM',
				effect: { multipliers: { production: 1.5 } },
			};
			req.body = eventData;

			// Mock service response
			const mockResult = {
				events: [{ ...eventData, active: true }],
			};
			eventTemplateService.createEvents.mockResolvedValue(mockResult);

			// Call controller method
			await eventTemplateController.createEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.createEvents).toHaveBeenCalledWith([
				eventData,
			]);
			expect(res.json).toHaveBeenCalledWith(mockResult.events[0]);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if event data is missing', async () => {
			// Mock missing event data
			req.body = null;

			// Call controller method
			await eventTemplateController.createEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.createEvents).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it('should call next with error from service', async () => {
			// Mock data
			req.body = { id: 'event1', name: 'Test Event' };

			// Mock service error
			const mockError = new ApiError(400, 'Service error');
			eventTemplateService.createEvents.mockRejectedValue(mockError);

			// Call controller method
			await eventTemplateController.createEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.createEvents).toHaveBeenCalledWith([
				req.body,
			]);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(mockError);
		});
	});

	describe('updateEventTemplate', () => {
		it('should update event template and return result', async () => {
			// Mock data
			const eventId = 'event1';
			const eventData = {
				name: 'Updated Event',
				description: {
					en: 'Updated Description',
					ru: 'Обновленное Описание',
				},
			};
			req.params = { eventId };
			req.body = eventData;

			// Mock service response
			const mockResult = { id: eventId, ...eventData, active: true };
			eventTemplateService.updateEvent.mockResolvedValue(mockResult);

			// Call controller method
			await eventTemplateController.updateEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.updateEvent).toHaveBeenCalledWith(
				eventId,
				eventData
			);
			expect(res.json).toHaveBeenCalledWith(mockResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if eventId is missing', async () => {
			// Mock missing eventId
			req.params = {};
			req.body = { name: 'Updated Event' };

			// Call controller method
			await eventTemplateController.updateEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.updateEvent).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it('should call next with error from service', async () => {
			// Mock data
			req.params = { eventId: 'event1' };
			req.body = { name: 'Updated Event' };

			// Mock service error
			const mockError = new ApiError(400, 'Service error');
			eventTemplateService.updateEvent.mockRejectedValue(mockError);

			// Call controller method
			await eventTemplateController.updateEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.updateEvent).toHaveBeenCalledWith(
				'event1',
				req.body
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(mockError);
		});
	});

	describe('getAllEventTemplates', () => {
		it('should return all event templates', async () => {
			// Mock service response
			const mockEvents = [
				{ id: 'event1', name: 'Event 1' },
				{ id: 'event2', name: 'Event 2' },
			];
			eventTemplateService.getAllEvents.mockResolvedValue(mockEvents);

			// Call controller method
			await eventTemplateController.getAllEventTemplates(req, res, next);

			// Assertions
			expect(eventTemplateService.getAllEvents).toHaveBeenCalled();
			expect(res.json).toHaveBeenCalledWith(mockEvents);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error from service', async () => {
			// Mock service error
			const mockError = new ApiError(500, 'Service error');
			eventTemplateService.getAllEvents.mockRejectedValue(mockError);

			// Call controller method
			await eventTemplateController.getAllEventTemplates(req, res, next);

			// Assertions
			expect(eventTemplateService.getAllEvents).toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(mockError);
		});
	});

	describe('getEventTemplate', () => {
		it('should return event template by id', async () => {
			// Mock data
			const eventId = 'event1';
			req.params = { eventId };

			// Mock service response
			const mockEvent = { id: eventId, name: 'Test Event' };
			eventTemplateService.getEvent.mockResolvedValue(mockEvent);

			// Call controller method
			await eventTemplateController.getEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(eventId);
			expect(res.json).toHaveBeenCalledWith(mockEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if eventId is missing', async () => {
			// Mock missing eventId
			req.params = {};

			// Call controller method
			await eventTemplateController.getEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.getEvent).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it('should call next with error from service', async () => {
			// Mock data
			req.params = { eventId: 'event1' };

			// Mock service error
			const mockError = new ApiError(404, 'Event not found');
			eventTemplateService.getEvent.mockRejectedValue(mockError);

			// Call controller method
			await eventTemplateController.getEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(
				'event1'
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(mockError);
		});
	});

	describe('deleteEventTemplate', () => {
		it('should delete event template and return result', async () => {
			// Mock data
			const eventId = 'event1';
			req.params = { eventId };

			// Mock service response
			const mockResult = {
				message: 'Event template deleted successfully',
				id: eventId,
			};
			eventTemplateService.deleteEvent.mockResolvedValue(mockResult);

			// Call controller method
			await eventTemplateController.deleteEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.deleteEvent).toHaveBeenCalledWith(
				eventId
			);
			expect(res.json).toHaveBeenCalledWith(mockResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if eventId is missing', async () => {
			// Mock missing eventId
			req.params = {};

			// Call controller method
			await eventTemplateController.deleteEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.deleteEvent).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it('should call next with error from service', async () => {
			// Mock data
			req.params = { eventId: 'event1' };

			// Mock service error
			const mockError = new ApiError(404, 'Event not found');
			eventTemplateService.deleteEvent.mockRejectedValue(mockError);

			// Call controller method
			await eventTemplateController.deleteEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.deleteEvent).toHaveBeenCalledWith(
				'event1'
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(mockError);
		});
	});

	describe('activateEventTemplate', () => {
		it('should activate inactive event template and return result', async () => {
			// Mock data
			const eventId = 'event1';
			req.params = { eventId };

			// Mock service responses
			const mockEvent = {
				id: eventId,
				name: 'Test Event',
				active: false,
			};
			const mockUpdatedEvent = {
				id: eventId,
				name: 'Test Event',
				active: true,
			};

			eventTemplateService.getEvent.mockResolvedValue(mockEvent);
			eventTemplateService.toggleEventActive.mockResolvedValue(
				mockUpdatedEvent
			);

			// Call controller method
			await eventTemplateController.activateEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(eventId);
			expect(eventTemplateService.toggleEventActive).toHaveBeenCalledWith(
				eventId
			);
			expect(res.json).toHaveBeenCalledWith(mockUpdatedEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should not toggle already active event template', async () => {
			// Mock data
			const eventId = 'event1';
			req.params = { eventId };

			// Mock service response - already active
			const mockEvent = { id: eventId, name: 'Test Event', active: true };
			eventTemplateService.getEvent.mockResolvedValue(mockEvent);

			// Call controller method
			await eventTemplateController.activateEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(eventId);
			expect(
				eventTemplateService.toggleEventActive
			).not.toHaveBeenCalled();
			expect(res.json).toHaveBeenCalledWith(mockEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if eventId is missing', async () => {
			// Mock missing eventId
			req.params = {};

			// Call controller method
			await eventTemplateController.activateEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.getEvent).not.toHaveBeenCalled();
			expect(
				eventTemplateService.toggleEventActive
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it('should call next with error from service', async () => {
			// Mock data
			req.params = { eventId: 'event1' };

			// Mock service error
			const mockError = new ApiError(404, 'Event not found');
			eventTemplateService.getEvent.mockRejectedValue(mockError);

			// Call controller method
			await eventTemplateController.activateEventTemplate(req, res, next);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(
				'event1'
			);
			expect(
				eventTemplateService.toggleEventActive
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(mockError);
		});
	});

	describe('deactivateEventTemplate', () => {
		it('should deactivate active event template and return result', async () => {
			// Mock data
			const eventId = 'event1';
			req.params = { eventId };

			// Mock service responses
			const mockEvent = { id: eventId, name: 'Test Event', active: true };
			const mockUpdatedEvent = {
				id: eventId,
				name: 'Test Event',
				active: false,
			};

			eventTemplateService.getEvent.mockResolvedValue(mockEvent);
			eventTemplateService.toggleEventActive.mockResolvedValue(
				mockUpdatedEvent
			);

			// Call controller method
			await eventTemplateController.deactivateEventTemplate(
				req,
				res,
				next
			);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(eventId);
			expect(eventTemplateService.toggleEventActive).toHaveBeenCalledWith(
				eventId
			);
			expect(res.json).toHaveBeenCalledWith(mockUpdatedEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should not toggle already inactive event template', async () => {
			// Mock data
			const eventId = 'event1';
			req.params = { eventId };

			// Mock service response - already inactive
			const mockEvent = {
				id: eventId,
				name: 'Test Event',
				active: false,
			};
			eventTemplateService.getEvent.mockResolvedValue(mockEvent);

			// Call controller method
			await eventTemplateController.deactivateEventTemplate(
				req,
				res,
				next
			);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(eventId);
			expect(
				eventTemplateService.toggleEventActive
			).not.toHaveBeenCalled();
			expect(res.json).toHaveBeenCalledWith(mockEvent);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if eventId is missing', async () => {
			// Mock missing eventId
			req.params = {};

			// Call controller method
			await eventTemplateController.deactivateEventTemplate(
				req,
				res,
				next
			);

			// Assertions
			expect(eventTemplateService.getEvent).not.toHaveBeenCalled();
			expect(
				eventTemplateService.toggleEventActive
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it('should call next with error from service', async () => {
			// Mock data
			req.params = { eventId: 'event1' };

			// Mock service error
			const mockError = new ApiError(404, 'Event not found');
			eventTemplateService.getEvent.mockRejectedValue(mockError);

			// Call controller method
			await eventTemplateController.deactivateEventTemplate(
				req,
				res,
				next
			);

			// Assertions
			expect(eventTemplateService.getEvent).toHaveBeenCalledWith(
				'event1'
			);
			expect(
				eventTemplateService.toggleEventActive
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(mockError);
		});
	});
});
