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

	describe('registerUpgradePayment', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Resource transferred to the system for an upgrade',
			nodeId: 456,
			resource: 'stardust',
			amount: 100,
		};

		beforeEach(() => {
			gameService.registerUpgradePayment.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should register upgrade payment successfully', async () => {
			mockReq.body = {
				userId: 123,
				nodeId: 456,
				amount: 100,
				resource: 'stardust',
			};

			await gameController.registerUpgradePayment(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.registerUpgradePayment).toHaveBeenCalledWith({
				userId: 123,
				nodeId: 456,
				amount: 100,
				resource: 'stardust',
			});
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});

		it('should throw error when missing required fields', async () => {
			mockReq.body = {
				userId: 123,
				// Missing nodeId, amount, resource
			};

			await gameController.registerUpgradePayment(
				mockReq,
				mockRes,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it('should throw error when amount is not positive', async () => {
			mockReq.body = {
				userId: 123,
				nodeId: 456,
				amount: 0,
				resource: 'stardust',
			};

			await gameController.registerUpgradePayment(
				mockReq,
				mockRes,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
		});
	});

	describe('registerTaskReward', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Resource transferred to the user for completing a task',
			taskId: 789,
			resource: 'darkMatter',
			amount: 50,
		};

		beforeEach(() => {
			gameService.registerTaskReward.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should register task reward successfully', async () => {
			mockReq.body = {
				userId: 123,
				taskId: 789,
				amount: 50,
				resource: 'darkMatter',
			};

			await gameController.registerTaskReward(mockReq, mockRes, mockNext);

			expect(gameService.registerTaskReward).toHaveBeenCalledWith({
				userId: 123,
				taskId: 789,
				amount: 50,
				resource: 'darkMatter',
			});
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});
	});

	describe('registerEventReward', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Resource transferred to the user for an event',
			eventId: 999,
			resource: 'tgStars',
			amount: 25,
		};

		beforeEach(() => {
			gameService.registerEventReward.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should register event reward successfully', async () => {
			mockReq.body = {
				userId: 123,
				eventId: 999,
				amount: 25,
				resource: 'tgStars',
			};

			await gameController.registerEventReward(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.registerEventReward).toHaveBeenCalledWith({
				userId: 123,
				eventId: 999,
				amount: 25,
				resource: 'tgStars',
			});
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});
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
			mockReq.body = {
				offerData: [
					{ amount: 100, resource: 'stardust' },
					{ amount: 50, resource: 'darkMatter' },
				],
				buyerId: 123,
			};

			await gameController.registerFarmingReward(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.registerFarmingReward).toHaveBeenCalledWith(
				[
					{ amount: 100, resource: 'stardust' },
					{ amount: 50, resource: 'darkMatter' },
				],
				123
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});

		it('should throw error when offerData is not an array', async () => {
			mockReq.body = {
				offerData: 'not an array',
				buyerId: 123,
			};

			await gameController.registerFarmingReward(
				mockReq,
				mockRes,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
		});
	});

	describe('registerStarsTransfer', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Resource transferred to the user for farming',
			offerData: {},
		};

		beforeEach(() => {
			gameService.registerStarsTransfer.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should register stars transfer successfully', async () => {
			mockReq.body = {
				buyerId: 123,
				sellerId: 456,
				amount: 100,
				resource: 'stardust',
			};

			await gameController.registerStarsTransfer(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.registerStarsTransfer).toHaveBeenCalledWith({
				buyerId: 123,
				sellerId: 456,
				amount: 100,
				resource: 'stardust',
			});
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});
	});

	describe('createGalaxyWithOffer', () => {
		const mockServiceResponse = {
			galaxy: { id: 1, seed: 'test-seed' },
			userState: { id: 1, userId: 123 },
			offerOut: { id: 1 },
			marketTransaction: { id: 1 },
			payment: { id: 1 },
			transferStars: { id: 1 },
		};

		beforeEach(() => {
			gameService.createGalaxyWithOffer.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should create galaxy with offer successfully', async () => {
			mockReq.body = {
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
			};

			await gameController.createGalaxyWithOffer(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.createGalaxyWithOffer).toHaveBeenCalledWith(
				{
					seed: 'test-seed-123',
					starMin: 100,
					starCurrent: 150,
				},
				{
					buyerId: 123,
					price: 1000,
					currency: 'tonToken',
				}
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});

		it('should throw error when galaxy seed is missing', async () => {
			mockReq.body = {
				galaxyData: {
					// Missing seed
					starMin: 100,
					starCurrent: 150,
				},
				offer: {
					buyerId: 123,
					price: 1000,
					currency: 'tonToken',
				},
			};

			await gameController.createGalaxyWithOffer(
				mockReq,
				mockRes,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
		});
	});

	describe('createGalaxyForSale', () => {
		const mockServiceResponse = {
			galaxy: { id: 1, seed: 'test-seed' },
			offerOut: { id: 1 },
			transactionMarket: { id: 1 },
			payment: { id: 1 },
		};

		beforeEach(() => {
			gameService.createGalaxyForSale.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should create galaxy for sale successfully', async () => {
			mockReq.body = {
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
			};

			await gameController.createGalaxyForSale(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.createGalaxyForSale).toHaveBeenCalledWith(
				{
					seed: 'test-seed-123',
					starMin: 100,
					starCurrent: 150,
				},
				{
					buyerId: 123,
					price: 1000,
					currency: 'tonToken',
				}
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});
	});

	describe('transferStarsToUser', () => {
		const mockServiceResponse = {
			success: true,
			message: 'Stars transferred successfully',
		};

		beforeEach(() => {
			gameService.transferStarsToUser.mockResolvedValue(
				mockServiceResponse
			);
		});

		it('should transfer stars to user successfully', async () => {
			mockReq.body = {
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
			};

			await gameController.transferStarsToUser(
				mockReq,
				mockRes,
				mockNext
			);

			expect(gameService.transferStarsToUser).toHaveBeenCalledWith(
				123,
				{
					starCurrent: 100,
					particleCount: 200,
				},
				{
					seed: 'test-seed-123',
					amount: 50,
					resource: 'stardust',
				}
			);
			expect(mockRes.status).toHaveBeenCalledWith(200);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockServiceResponse,
			});
		});
	});
});
