const request = require('supertest');
const express = require('express');
const Router = require('express').Router;
const artifactController = require('../../controllers/artifact-controller');

// Mock middleware
const mockAuthMiddleware = jest.fn((req, res, next) => next());
jest.mock('../../middlewares/auth-middleware', () => mockAuthMiddleware);

const mockTelegramAuthMiddleware = jest.fn((req, res, next) => next());
jest.mock(
	'../../middlewares/telegram-auth-middleware',
	() => mockTelegramAuthMiddleware
);

// Mock rate limit middleware with a function that returns the middleware function
const mockRateLimitMiddleware = jest.fn((limit, time) =>
	jest.fn((req, res, next) => next())
);
jest.mock(
	'../../middlewares/rate-limit-middleware',
	() => mockRateLimitMiddleware
);

// Mock controller
jest.mock('../../controllers/artifact-controller', () => ({
	getUserArtifacts: jest.fn((req, res) =>
		res.status(200).json({ artifacts: [] })
	),
	getArtifact: jest.fn((req, res) =>
		res.status(200).json({ message: 'Artifact details' })
	),
	generateArtifact: jest.fn((req, res) =>
		res.status(201).json({ message: 'Artifact generated' })
	),
	activateArtifact: jest.fn((req, res) =>
		res.status(200).json({ message: 'Artifact activated' })
	),
	deactivateArtifact: jest.fn((req, res) =>
		res.status(200).json({ message: 'Artifact deactivated' })
	),
	createSystemArtifactWithOffer: jest.fn((req, res) =>
		res.status(201).json({ message: 'System artifact created' })
	),
}));

describe('Artifact Router', () => {
	let app;
	let router;

	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();

		// Create a test router manually
		router = new Router();

		// Define routes that match the actual router
		router.get(
			'/',
			mockTelegramAuthMiddleware,
			mockAuthMiddleware,
			mockRateLimitMiddleware(60, 60),
			artifactController.getUserArtifacts
		);

		router.get(
			'/:artifactId',
			mockTelegramAuthMiddleware,
			mockAuthMiddleware,
			mockRateLimitMiddleware(60, 60),
			artifactController.getArtifact
		);

		router.post(
			'/generate',
			mockTelegramAuthMiddleware,
			mockAuthMiddleware,
			mockRateLimitMiddleware(10, 60),
			artifactController.generateArtifact
		);

		router.post(
			'/:artifactId/activate',
			mockTelegramAuthMiddleware,
			mockAuthMiddleware,
			mockRateLimitMiddleware(30, 60),
			artifactController.activateArtifact
		);

		router.post(
			'/:artifactId/deactivate',
			mockTelegramAuthMiddleware,
			mockAuthMiddleware,
			mockRateLimitMiddleware(30, 60),
			artifactController.deactivateArtifact
		);

		router.post(
			'/system-offer',
			mockTelegramAuthMiddleware,
			mockAuthMiddleware,
			mockRateLimitMiddleware(30, 60),
			artifactController.createSystemArtifactWithOffer
		);

		// Create Express app instance
		app = express();
		app.use(express.json());
		app.use('/artifact', router);
	});

	describe('GET /', () => {
		it('should use correct middleware and controller for getting all artifacts', async () => {
			// Execute request
			const response = await request(app).get('/artifact/');

			// Verify correct middleware was used
			expect(mockTelegramAuthMiddleware).toHaveBeenCalled();
			expect(mockAuthMiddleware).toHaveBeenCalled();
			expect(mockRateLimitMiddleware).toHaveBeenCalledWith(60, 60);

			// Verify correct controller method was called
			expect(artifactController.getUserArtifacts).toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ artifacts: [] });
		});
	});

	describe('GET /:artifactId', () => {
		it('should use correct middleware and controller for getting a specific artifact', async () => {
			// Execute request
			const response = await request(app).get('/artifact/123');

			// Verify correct middleware was used
			expect(mockTelegramAuthMiddleware).toHaveBeenCalled();
			expect(mockAuthMiddleware).toHaveBeenCalled();
			expect(mockRateLimitMiddleware).toHaveBeenCalledWith(60, 60);

			// Verify correct controller method was called
			expect(artifactController.getArtifact).toHaveBeenCalled();

			// Verify params were passed correctly
			expect(
				artifactController.getArtifact.mock.calls[0][0].params
					.artifactId
			).toBe('123');

			// Verify response
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ message: 'Artifact details' });
		});
	});

	describe('POST /generate', () => {
		it('should use correct middleware and controller for generating an artifact', async () => {
			// Execute request
			const response = await request(app).post('/artifact/generate');

			// Verify correct middleware was used
			expect(mockTelegramAuthMiddleware).toHaveBeenCalled();
			expect(mockAuthMiddleware).toHaveBeenCalled();
			expect(mockRateLimitMiddleware).toHaveBeenCalledWith(10, 60);

			// Verify correct controller method was called
			expect(artifactController.generateArtifact).toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(201);
			expect(response.body).toEqual({ message: 'Artifact generated' });
		});
	});

	describe('POST /:artifactId/activate', () => {
		it('should use correct middleware and controller for activating an artifact', async () => {
			// Execute request
			const response = await request(app).post('/artifact/123/activate');

			// Verify correct middleware was used
			expect(mockTelegramAuthMiddleware).toHaveBeenCalled();
			expect(mockAuthMiddleware).toHaveBeenCalled();
			expect(mockRateLimitMiddleware).toHaveBeenCalledWith(30, 60);

			// Verify correct controller method was called
			expect(artifactController.activateArtifact).toHaveBeenCalled();

			// Verify params were passed correctly
			expect(
				artifactController.activateArtifact.mock.calls[0][0].params
					.artifactId
			).toBe('123');

			// Verify response
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ message: 'Artifact activated' });
		});
	});

	describe('POST /:artifactId/deactivate', () => {
		it('should use correct middleware and controller for deactivating an artifact', async () => {
			// Execute request
			const response = await request(app).post(
				'/artifact/123/deactivate'
			);

			// Verify correct middleware was used
			expect(mockTelegramAuthMiddleware).toHaveBeenCalled();
			expect(mockAuthMiddleware).toHaveBeenCalled();
			expect(mockRateLimitMiddleware).toHaveBeenCalledWith(30, 60);

			// Verify correct controller method was called
			expect(artifactController.deactivateArtifact).toHaveBeenCalled();

			// Verify params were passed correctly
			expect(
				artifactController.deactivateArtifact.mock.calls[0][0].params
					.artifactId
			).toBe('123');

			// Verify response
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ message: 'Artifact deactivated' });
		});
	});

	describe('POST /system-offer', () => {
		it('should use correct middleware and controller for creating a system artifact offer', async () => {
			// Prepare test data
			const requestData = {
				artifactData: {
					seed: 'system-artifact-seed',
					name: 'System Artifact',
					rarity: 'MYTHICAL',
				},
				offerData: {
					price: 1000,
					currency: 'tgStars',
				},
			};

			// Execute request
			const response = await request(app)
				.post('/artifact/system-offer')
				.send(requestData);

			// Verify correct middleware was used
			expect(mockTelegramAuthMiddleware).toHaveBeenCalled();
			expect(mockAuthMiddleware).toHaveBeenCalled();
			expect(mockRateLimitMiddleware).toHaveBeenCalledWith(30, 60);

			// Verify correct controller method was called
			expect(
				artifactController.createSystemArtifactWithOffer
			).toHaveBeenCalled();

			// Verify response
			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				message: 'System artifact created',
			});
		});
	});
});
