/**
 * Tests for Game Router
 * Created by Claude on 15.07.2025
 */
const request = require('supertest');
const express = require('express');
const gameRouter = require('../../routes/game-router');

// Mock middlewares
jest.mock('../../middlewares/auth-middleware');
jest.mock('../../middlewares/telegram-auth-middleware');
jest.mock('../../middlewares/rate-limit-middleware');

// Mock controller
jest.mock('../../controllers/game-controller');

const app = express();
app.use(express.json());
app.use('/api/game', gameRouter);

describe('Game Router', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /api/game/upgrade-payment', () => {
		it('should call registerUpgradePayment controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.registerUpgradePayment.mockImplementation(
				(req, res) => {
					res.status(200).json({ success: true });
				}
			);

			const response = await request(app)
				.post('/api/game/upgrade-payment')
				.send({
					userId: 123,
					nodeId: 456,
					amount: 100,
					resource: 'stardust',
				});

			expect(response.status).toBe(200);
			expect(gameController.registerUpgradePayment).toHaveBeenCalled();
		});
	});

	describe('POST /api/game/task-reward', () => {
		it('should call registerTaskReward controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.registerTaskReward.mockImplementation((req, res) => {
				res.status(200).json({ success: true });
			});

			const response = await request(app)
				.post('/api/game/task-reward')
				.send({
					userId: 123,
					taskId: 789,
					amount: 50,
					resource: 'darkMatter',
				});

			expect(response.status).toBe(200);
			expect(gameController.registerTaskReward).toHaveBeenCalled();
		});
	});

	describe('POST /api/game/event-reward', () => {
		it('should call registerEventReward controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.registerEventReward.mockImplementation(
				(req, res) => {
					res.status(200).json({ success: true });
				}
			);

			const response = await request(app)
				.post('/api/game/event-reward')
				.send({
					userId: 123,
					eventId: 999,
					amount: 25,
					resource: 'tgStars',
				});

			expect(response.status).toBe(200);
			expect(gameController.registerEventReward).toHaveBeenCalled();
		});
	});

	describe('POST /api/game/farming-reward', () => {
		it('should call registerFarmingReward controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.registerFarmingReward.mockImplementation(
				(req, res) => {
					res.status(200).json({ success: true });
				}
			);

			const response = await request(app)
				.post('/api/game/farming-reward')
				.send({
					offerData: [
						{ amount: 100, resource: 'stardust' },
						{ amount: 50, resource: 'darkMatter' },
					],
					buyerId: 123,
				});

			expect(response.status).toBe(200);
			expect(gameController.registerFarmingReward).toHaveBeenCalled();
		});
	});

	describe('POST /api/game/stars-transfer', () => {
		it('should call registerStarsTransfer controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.registerStarsTransfer.mockImplementation(
				(req, res) => {
					res.status(200).json({ success: true });
				}
			);

			const response = await request(app)
				.post('/api/game/stars-transfer')
				.send({
					buyerId: 123,
					sellerId: 456,
					amount: 100,
					resource: 'stardust',
				});

			expect(response.status).toBe(200);
			expect(gameController.registerStarsTransfer).toHaveBeenCalled();
		});
	});

	describe('POST /api/game/galaxy-with-offer', () => {
		it('should call createGalaxyWithOffer controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.createGalaxyWithOffer.mockImplementation(
				(req, res) => {
					res.status(200).json({ success: true });
				}
			);

			const response = await request(app)
				.post('/api/game/galaxy-with-offer')
				.send({
					galaxyData: {
						seed: 'test-seed-123',
						starMin: 100,
						starCurrent: 150,
					},
					offer: {
						buyerId: 123,
						price: 1000,
						currency: 'tonToken',
					},
				});

			expect(response.status).toBe(200);
			expect(gameController.createGalaxyWithOffer).toHaveBeenCalled();
		});
	});

	describe('POST /api/game/galaxy-for-sale', () => {
		it('should call createGalaxyForSale controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.createGalaxyForSale.mockImplementation(
				(req, res) => {
					res.status(200).json({ success: true });
				}
			);

			const response = await request(app)
				.post('/api/game/galaxy-for-sale')
				.send({
					galaxyData: {
						seed: 'test-seed-123',
						starMin: 100,
						starCurrent: 150,
					},
					offer: {
						buyerId: 123,
						price: 1000,
						currency: 'tonToken',
					},
				});

			expect(response.status).toBe(200);
			expect(gameController.createGalaxyForSale).toHaveBeenCalled();
		});
	});

	describe('POST /api/game/transfer-stars', () => {
		it('should call transferStarsToUser controller', async () => {
			const gameController = require('../../controllers/game-controller');
			gameController.transferStarsToUser.mockImplementation(
				(req, res) => {
					res.status(200).json({ success: true });
				}
			);

			const response = await request(app)
				.post('/api/game/transfer-stars')
				.send({
					userId: 123,
					galaxyData: {
						starCurrent: 100,
						particleCount: 200,
					},
					offer: {
						seed: 'test-seed-123',
						amount: 50,
						resource: 'stardust',
					},
				});

			expect(response.status).toBe(200);
			expect(gameController.transferStarsToUser).toHaveBeenCalled();
		});
	});

	describe('Middleware integration', () => {
		it('should apply Telegram WebApp data validation middleware', () => {
			const validateTelegramWebAppData = require('../../middlewares/telegram-auth-middleware');
			expect(validateTelegramWebAppData).toHaveBeenCalled();
		});

		it('should apply rate limiting middleware', () => {
			const rateLimitMiddleware = require('../../middlewares/rate-limit-middleware');
			expect(rateLimitMiddleware).toHaveBeenCalled();
		});

		it('should apply auth middleware to all routes', () => {
			const authMiddleware = require('../../middlewares/auth-middleware');
			expect(authMiddleware).toHaveBeenCalled();
		});
	});
});
