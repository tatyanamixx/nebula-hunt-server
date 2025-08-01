/**
 * Tests for Game Controller
 * Created by Claude on 15.07.2025
 */
const gameController = require('../../controllers/game-controller');
const gameService = require('../../service/game-service');
const ApiError = require('../../exceptions/api-error');

// Mock dependencies
jest.mock('../../service/game-service');
jest.mock('../../service/logger-service');

describe('Game Controller', () => {
	let mockReq;
	let mockRes;
	let mockNext;

	beforeEach(() => {
		mockReq = {
			body: {},
		};
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();

		// Reset mocks
		jest.clearAllMocks();
	});

	describe('registerFarmingReward', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Resource transferred to the user for farming',
			userState: { id: 1, userId: 123 },
			offerData: [],
		};

		beforeEach(() => {
			gameService.registerFarmingReward.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should register farming reward successfully', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {
				offerData: [
					{ amount: 100, resource: 'stardust' },
					{ amount: 50, resource: 'darkMatter' },
				],
			};

			await gameController.registerFarmingReward(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.registerFarmingReward).toHaveBeenCalledWith(
				123,
				[
					{ amount: 100, resource: 'stardust' },
					{ amount: 50, resource: 'darkMatter' },
				]
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				message: 'Farming rewards registered successfully',
				data: mockServiceResponse,
			});
		});

		it('should throw error when offerData is not an array', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {
				offerData: 'not an array',
			};

			await gameController.registerFarmingReward(
				mockReq,
				mockRes,
				mockNext
			);

			expect(mockNext).toHaveBeenCalled();
			const error = mockNext.mock.calls[0][0];
			expect(error.message).toContain('offerData must be an array');
		});

		it('should throw error when offerData length is not 2', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {
				offerData: [{ amount: 100, resource: 'stardust' }],
			};

			await gameController.registerFarmingReward(
				mockReq,
				mockRes,
				mockNext
			);

			expect(mockNext).toHaveBeenCalled();
			const error = mockNext.mock.calls[0][0];
			expect(error.message).toContain('offerData must contain exactly 2 elements');
		});
	});

	describe('createGalaxyWithOffer', () => {
		const mockServiceResponse = {
			success: true,
			data: {
				galaxy: { id: 1, seed: 'test-seed' },
				offer: { id: 1, price: 100 },
			},
		};

		beforeEach(() => {
			gameService.createGalaxyAsGift.mockResolvedValue(mockServiceResponse);
		});

		it('should create galaxy with offer successfully', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {
				galaxyData: { seed: 'test-seed', name: 'Test Galaxy' },
				offer: { buyerId: 123, price: 100, currency: 'tonToken' },
			};

			await gameController.createGalaxyWithOffer(mockReq, mockRes, mockNext);

			expect(gameService.createGalaxyAsGift).toHaveBeenCalledWith(
				{ seed: 'test-seed', name: 'Test Galaxy' },
				123,
				{ buyerId: 123, price: 100, currency: 'tonToken' }
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse.data,
			});
		});
	});

	describe('createGalaxyForSale', () => {
		const mockServiceResponse = {
			success: true,
			data: {
				galaxy: { id: 1, seed: 'test-seed' },
				offer: { id: 1, price: 100 },
			},
		};

		beforeEach(() => {
			gameService.createGalaxyForSale.mockResolvedValue(mockServiceResponse);
		});

		it('should create galaxy for sale successfully', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {
				galaxyData: { seed: 'test-seed', name: 'Test Galaxy' },
				offer: { buyerId: 123, price: 100, currency: 'tonToken' },
			};

			await gameController.createGalaxyForSale(mockReq, mockRes, mockNext);

			expect(gameService.createGalaxyForSale).toHaveBeenCalledWith(
				{ seed: 'test-seed', name: 'Test Galaxy' },
				{ buyerId: 123, price: 100, currency: 'tonToken' }
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse.data,
			});
		});
	});

	describe('registerTransferStardustToGalaxy', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Galaxy purchase offer registered successfully',
			data: {
				galaxy: { id: 1, seed: 'test-seed' },
				offer: { id: 1, price: 100 },
			},
		};

		beforeEach(() => {
			gameService.registerTransferStardustToGalaxy.mockResolvedValue(mockServiceResponse);
		});

		it('should register transfer stardust to galaxy successfully', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {
				galaxy: { seed: 'test-seed' },
				reward: {
					currency: 'tonToken',
					price: 100,
					resource: 'stardust',
					amount: 50,
				},
			};

			await gameController.registerTransferStardustToGalaxy(mockReq, mockRes, mockNext);

			expect(gameService.registerTransferStardustToGalaxy).toHaveBeenCalledWith(
				123,
				{ seed: 'test-seed' },
				{
					currency: 'tonToken',
					price: 100,
					resource: 'stardust',
					amount: 50,
				}
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				message: 'Galaxy purchase offer registered successfully',
				data: mockServiceResponse.data,
			});
		});
	});

	describe('claimDailyReward', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Daily reward claimed successfully',
			data: {
				currentStreak: 3,
				maxStreak: 5,
				rewards: [
					{
						resource: 'darkMatter',
						amount: 150,
						transactionId: 123
					}
				],
				userState: {
					stardust: 1000,
					darkMatter: 250,
					stars: 50
				}
			}
		};

		beforeEach(() => {
			gameService.claimDailyReward.mockResolvedValue(mockServiceResponse);
		});

		it('should claim daily reward successfully', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {};

			await gameController.claimDailyReward(mockReq, mockRes, mockNext);

			expect(gameService.claimDailyReward).toHaveBeenCalledWith(123);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				message: 'Daily reward claimed successfully',
				data: mockServiceResponse.data
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should handle errors and call next', async () => {
			mockReq.initData = { id: 123 };
			mockReq.body = {};
			const mockError = new Error('Daily reward already claimed');

			gameService.claimDailyReward.mockRejectedValue(mockError);

			await gameController.claimDailyReward(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(mockError);
			expect(mockRes.json).not.toHaveBeenCalled();
		});

		it('should handle missing initData', async () => {
			mockReq.initData = null;
			mockReq.body = {};

			gameService.claimDailyReward.mockRejectedValue(new Error('User not found'));

			await gameController.claimDailyReward(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});
	});
});
