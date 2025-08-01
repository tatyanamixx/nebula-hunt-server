const request = require('supertest');
const express = require('express');
const eventTemplateRouter = require('../../routes/event-template-router');
const eventTemplateController = require('../../controllers/event-template-controller');
const authMiddleware = require('../../middlewares/auth-middleware');
const adminAuthMiddleware = require('../../middlewares/admin-auth-middleware');
const telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../../middlewares/rate-limit-middleware');

// Mock middlewares
jest.mock('../../middlewares/auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/admin-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/telegram-auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/rate-limit-middleware', () => {
	const mockRateLimitFn = jest.fn(() => (req, res, next) => next());
	return mockRateLimitFn;
});

// Mock controller methods
jest.mock('../../controllers/event-template-controller', () => ({
	getAllEventTemplates: jest.fn((req, res) =>
		res.json({ message: 'getAllEventTemplates called' })
	),
	getEventTemplate: jest.fn((req, res) =>
		res.json({ message: 'getEventTemplate called', id: req.params.eventId })
	),
	createEventTemplate: jest.fn((req, res) =>
		res.json({ message: 'createEventTemplate called', data: req.body })
	),
	updateEventTemplate: jest.fn((req, res) =>
		res.json({
			message: 'updateEventTemplate called',
			id: req.params.eventId,
			data: req.body,
		})
	),
	deleteEventTemplate: jest.fn((req, res) =>
		res.json({
			message: 'deleteEventTemplate called',
			id: req.params.eventId,
		})
	),
	activateEventTemplate: jest.fn((req, res) =>
		res.json({
			message: 'activateEventTemplate called',
			id: req.params.eventId,
		})
	),
	deactivateEventTemplate: jest.fn((req, res) =>
		res.json({
			message: 'deactivateEventTemplate called',
			id: req.params.eventId,
		})
	),
}));

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/event-templates', eventTemplateRouter);

describe('EventTemplateRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /', () => {
		it('should call getAllEventTemplates controller method', async () => {
			const response = await request(app).get('/api/event-templates');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: 'getAllEventTemplates called',
			});
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminAuthMiddleware).toHaveBeenCalled();
			expect(
				eventTemplateController.getAllEventTemplates
			).toHaveBeenCalled();
		});
	});

	describe('GET /:eventId', () => {
		it('should call getEventTemplate controller method with eventId', async () => {
			const response = await request(app).get(
				'/api/event-templates/event123'
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: 'getEventTemplate called',
				id: 'event123',
			});
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminAuthMiddleware).toHaveBeenCalled();
			expect(eventTemplateController.getEventTemplate).toHaveBeenCalled();
		});
	});

	describe('POST /', () => {
		it('should call createEventTemplate controller method with request body', async () => {
			const eventData = {
				name: 'Test Event',
				description: { en: 'Test Description', ru: 'Тест Описание' },
				type: 'RANDOM',
			};

			const response = await request(app)
				.post('/api/event-templates')
				.send(eventData);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: 'createEventTemplate called',
				data: eventData,
			});
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminAuthMiddleware).toHaveBeenCalled();
			expect(
				eventTemplateController.createEventTemplate
			).toHaveBeenCalled();
		});
	});

	describe('PUT /:eventId', () => {
		it('should call updateEventTemplate controller method with eventId and request body', async () => {
			const eventData = {
				name: 'Updated Event',
				description: {
					en: 'Updated Description',
					ru: 'Обновленное Описание',
				},
			};

			const response = await request(app)
				.put('/api/event-templates/event123')
				.send(eventData);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: 'updateEventTemplate called',
				id: 'event123',
				data: eventData,
			});
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminAuthMiddleware).toHaveBeenCalled();
			expect(
				eventTemplateController.updateEventTemplate
			).toHaveBeenCalled();
		});
	});

	describe('DELETE /:eventId', () => {
		it('should call deleteEventTemplate controller method with eventId', async () => {
			const response = await request(app).delete(
				'/api/event-templates/event123'
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: 'deleteEventTemplate called',
				id: 'event123',
			});
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminAuthMiddleware).toHaveBeenCalled();
			expect(
				eventTemplateController.deleteEventTemplate
			).toHaveBeenCalled();
		});
	});

	describe('POST /:eventId/activate', () => {
		it('should call activateEventTemplate controller method with eventId', async () => {
			const response = await request(app).post(
				'/api/event-templates/event123/activate'
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: 'activateEventTemplate called',
				id: 'event123',
			});
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminAuthMiddleware).toHaveBeenCalled();
			expect(
				eventTemplateController.activateEventTemplate
			).toHaveBeenCalled();
		});
	});

	describe('POST /:eventId/deactivate', () => {
		it('should call deactivateEventTemplate controller method with eventId', async () => {
			const response = await request(app).post(
				'/api/event-templates/event123/deactivate'
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: 'deactivateEventTemplate called',
				id: 'event123',
			});
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminAuthMiddleware).toHaveBeenCalled();
			expect(
				eventTemplateController.deactivateEventTemplate
			).toHaveBeenCalled();
		});
	});
});
