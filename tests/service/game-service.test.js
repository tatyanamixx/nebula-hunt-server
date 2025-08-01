/**
 * Tests for Game Service
 * Created by Claude on 15.07.2025
 */
const gameService = require('../../service/game-service');
const {
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
	UserState,
} = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');

// Mock dependencies
jest.mock('../../models/models');
jest.mock('../../db');
jest.mock('../../service/logger-service');
jest.mock('../../service/market-service');
jest.mock('../../service/user-state-service');

describe('Game Service', () => {
	let mockTransaction;

	beforeEach(() => {
		mockTransaction = {
			commit: jest.fn(),
			rollback: jest.fn(),
		};

		sequelize.transaction.mockResolvedValue(mockTransaction);

		// Reset mocks
		jest.clearAllMocks();
	});

	// Mock MarketTransaction.create
	MarketTransaction.create.mockResolvedValue({
		id: 1,
	});

	// Mock PaymentTransaction.create
	PaymentTransaction.create.mockResolvedValue({
		id: 1,
	});

	describe('registerFarmingReward', () => {
		const mockOfferData = {
			sellerId: -1, // SYSTEM_USER_ID
			buyerId: 123,
			itemType: 'resource',
			itemId: 'stardust_75',
			price: 0,
			currency: 'tonToken',
			offerType: 'SYSTEM',
			amount: 75,
			resource: 'stardust',
		};

		beforeEach(() => {
			// Mock UserState.findOne
			UserState.findOne.mockResolvedValue({
				id: 1,
				userId: 123,
				stardust: 0,
				update: jest.fn(),
			});

			// Mock MarketOffer.create
			MarketOffer.create.mockResolvedValue({
				id: 1,
				update: jest.fn(),
				save: jest.fn(),
			});

			// Mock MarketTransaction.create
			MarketTransaction.create.mockResolvedValue({
				id: 1,
				update: jest.fn(),
				save: jest.fn(),
			});

			// Mock PaymentTransaction.create
			PaymentTransaction.create.mockResolvedValue({
				id: 1,
				update: jest.fn(),
				save: jest.fn(),
			});
		});

		it('should register farming reward successfully', async () => {
			const result = await gameService.registerFarmingReward(
				mockOfferData
			);

			expect(result).toEqual({
				success: true,
				message: 'Resource transferred to the user for farming',
				offerData: mockOfferData,
			});
		});
	});

	describe('registerStarsTransfer', () => {
		const mockOffer = {
			buyerId: 123,
			sellerId: 456,
			status: 'ACTIVE',
			price: 100,
			currency: 'tonToken',
			offerType: 'P2P',
			amount: 50,
			itemType: 'resource',
			itemId: 'stardust_50',
			resource: 'stardust',
		};

		beforeEach(() => {
			// Mock UserState.findOne
			UserState.findOne.mockResolvedValue({
				id: 1,
				userId: 123,
				stardust: 0,
				tonToken: 200,
				update: jest.fn(),
			});

			// Mock MarketOffer.create
			MarketOffer.create.mockResolvedValue({
				id: 1,
				update: jest.fn(),
				save: jest.fn(),
			});

			// Mock MarketTransaction.create
			MarketTransaction.create.mockResolvedValue({
				id: 1,
				update: jest.fn(),
				save: jest.fn(),
			});

			// Mock PaymentTransaction.create
			PaymentTransaction.create.mockResolvedValue({
				id: 1,
				update: jest.fn(),
				save: jest.fn(),
			});
		});

		it('should register stars transfer successfully', async () => {
			const result = await gameService.registerStarsTransfer(mockOffer);

			expect(result).toEqual({
				success: true,
				message: 'Resource transferred to the user for farming',
				offerData: expect.any(Object),
			});
		});
	});

	describe('createGalaxyWithOffer', () => {
		const mockGalaxyData = {
			seed: 'test-seed-123',
			starMin: 100,
			starCurrent: 150,
			price: 1000,
			particleCount: 200,
			onParticleCountChange: true,
			galaxyProperties: { type: 'spiral' },
		};

		const mockOffer = {
			buyerId: 123,
			price: 1000,
			currency: 'tonToken',
		};

		beforeEach(() => {
			// Mock Galaxy.findOrCreate
			Galaxy.findOrCreate.mockResolvedValue([
				{
					id: 1,
					userId: 123,
					starMin: 100,
					starCurrent: 150,
					price: 1000,
					seed: 'test-seed-123',
					particleCount: 200,
					onParticleCountChange: true,
					galaxyProperties: { type: 'spiral' },
					active: true,
					toJSON: jest.fn().mockReturnValue({
						id: 1,
						userId: 123,
						starMin: 100,
						starCurrent: 150,
						price: 1000,
						seed: 'test-seed-123',
						particleCount: 200,
						onParticleCountChange: true,
						galaxyProperties: { type: 'spiral' },
						active: true,
					}),
				},
				true, // created = true
			]);

			// Mock sequelize.query
			sequelize.query.mockResolvedValue([]);

			// Mock marketService.registerOffer
			const marketService = require('../../service/market-service');
			marketService.registerOffer.mockResolvedValue({
				offerOut: { id: 1 },
				marketTransaction: { id: 1 },
				payment: { id: 1 },
				transferStars: { id: 1 },
			});

			// Mock userStateService.getUserState
			const userStateService = require('../../service/user-state-service');
			userStateService.getUserState.mockResolvedValue({
				id: 1,
				userId: 123,
				stardust: 500,
				darkMatter: 100,
				tgStars: 50,
			});
		});

		it('should create galaxy with offer successfully', async () => {
			const result = await gameService.createGalaxyWithOffer(
				mockGalaxyData,
				mockOffer,
				mockTransaction
			);

			expect(result).toEqual({
				createdGalaxy: true,
				galaxy: expect.any(Object),
				userState: expect.any(Object),
				offerOut: expect.any(Object),
				marketTransaction: expect.any(Object),
				payment: expect.any(Object),
				transferStars: expect.any(Object),
			});

			expect(Galaxy.findOrCreate).toHaveBeenCalledWith({
				where: { seed: 'test-seed-123' },
				defaults: {
					userId: 123,
					starMin: 100,
					starCurrent: 150,
					price: 1000,
					seed: 'test-seed-123',
					particleCount: 200,
					onParticleCountChange: true,
					galaxyProperties: { type: 'spiral' },
					active: true,
				},
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).toHaveBeenCalled();
		});

		it('should handle existing galaxy owned by same user', async () => {
			Galaxy.findOrCreate.mockResolvedValue([
				{
					id: 1,
					userId: 123,
					toJSON: jest.fn().mockReturnValue({ id: 1, userId: 123 }),
				},
				false, // created = false
			]);

			const result = await gameService.createGalaxyWithOffer(
				mockGalaxyData,
				mockOffer,
				mockTransaction
			);

			expect(result).toEqual({
				createdGalaxy: true,
				galaxy: expect.any(Object),
				userState: expect.any(Object),
				offerOut: expect.any(Object),
				marketTransaction: expect.any(Object),
				payment: expect.any(Object),
				transferStars: expect.any(Object),
			});
		});

		it('should handle existing galaxy owned by different user', async () => {
			Galaxy.findOrCreate.mockResolvedValue([
				{
					id: 1,
					userId: 456, // Different user
					toJSON: jest.fn().mockReturnValue({ id: 1, userId: 456 }),
				},
				false, // created = false
			]);

			await expect(
				gameService.createGalaxyWithOffer(
					mockGalaxyData,
					mockOffer,
					mockTransaction
				)
			).rejects.toThrow();
		});

		it('should handle database errors', async () => {
			Galaxy.findOrCreate.mockRejectedValue(new Error('Database error'));

			await expect(
				gameService.createGalaxyWithOffer(
					mockGalaxyData,
					mockOffer,
					mockTransaction
				)
			).rejects.toThrow();

			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('Helper methods', () => {
		describe('checkResourceAvailability', () => {
			it('should pass when user has sufficient resources', async () => {
				UserState.findOne.mockResolvedValue({
					id: 1,
					userId: 123,
					stardust: 200,
				});

				await expect(
					gameService.checkResourceAvailability(
						123,
						{ type: 'stardust', amount: 100 },
						mockTransaction
					)
				).resolves.not.toThrow();
			});

			it('should throw error when user has insufficient resources', async () => {
				UserState.findOne.mockResolvedValue({
					id: 1,
					userId: 123,
					stardust: 50,
				});

				await expect(
					gameService.checkResourceAvailability(
						123,
						{ type: 'stardust', amount: 100 },
						mockTransaction
					)
				).rejects.toThrow(ApiError);
			});
		});

		describe('addCurrency', () => {
			it('should add currency to user state', async () => {
				const mockUserState = {
					id: 1,
					userId: 123,
					stardust: 100,
					update: jest.fn(),
				};

				UserState.findOne.mockResolvedValue(mockUserState);

				await gameService.addCurrency(
					123,
					'stardust',
					50,
					mockTransaction
				);

				expect(mockUserState.update).toHaveBeenCalledWith(
					{ stardust: 150 },
					{ transaction: mockTransaction }
				);
			});
		});

		describe('deductCurrency', () => {
			it('should deduct currency from user state', async () => {
				const mockUserState = {
					id: 1,
					userId: 123,
					stardust: 200,
					update: jest.fn(),
				};

				UserState.findOne.mockResolvedValue(mockUserState);

				await gameService.deductCurrency(
					123,
					'stardust',
					50,
					mockTransaction
				);

				expect(mockUserState.update).toHaveBeenCalledWith(
					{ stardust: 150 },
					{ transaction: mockTransaction }
				);
			});

			it('should throw error when insufficient currency', async () => {
				const mockUserState = {
					id: 1,
					userId: 123,
					stardust: 50,
					update: jest.fn(),
				};

				UserState.findOne.mockResolvedValue(mockUserState);

				await expect(
					gameService.deductCurrency(
						123,
						'stardust',
						100,
						mockTransaction
					)
				).rejects.toThrow(ApiError);
			});
		});
	});
});

describe('claimDailyReward', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should claim daily reward successfully for first time user', async () => {
		const userId = 123;
		const mockUserState = {
			id: 1,
			userId: userId,
			stardust: 100,
			darkMatter: 50,
			stars: 25,
			lastDailyBonus: null,
			currentStreak: 0,
			maxStreak: 0
		};

		const mockUpdatedUserState = {
			...mockUserState,
			stardust: 200,
			darkMatter: 75,
			lastDailyBonus: new Date(),
			currentStreak: 1,
			maxStreak: 1
		};

		const mockMarketResult = {
			offer: { id: 1 },
			marketTransaction: { id: 1, status: 'COMPLETED' }
		};

		const userStateService = require('../../service/user-state-service');
		const marketService = require('../../service/market-service');

		userStateService.getUserState.mockResolvedValue(mockUserState);
		userStateService.updateUserState.mockResolvedValue(mockUpdatedUserState);
		userStateService.getUserState.mockResolvedValueOnce(mockUserState).mockResolvedValueOnce(mockUpdatedUserState);
		marketService.registerOffer.mockResolvedValue(mockMarketResult);

		const result = await gameService.claimDailyReward(userId);

		expect(result.success).toBe(true);
		expect(result.data.currentStreak).toBe(1);
		expect(result.data.maxStreak).toBe(1);
		expect(result.data.rewards).toHaveLength(2); // stardust and darkmatter
		expect(marketService.registerOffer).toHaveBeenCalledTimes(2);
	});

	it('should claim daily reward with streak continuation', async () => {
		const userId = 123;
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		
		const mockUserState = {
			id: 1,
			userId: userId,
			stardust: 100,
			darkMatter: 50,
			stars: 25,
			lastDailyBonus: yesterday,
			currentStreak: 2,
			maxStreak: 2
		};

		const mockUpdatedUserState = {
			...mockUserState,
			stardust: 300,
			darkMatter: 100,
			lastDailyBonus: new Date(),
			currentStreak: 3,
			maxStreak: 3
		};

		const mockMarketResult = {
			offer: { id: 1 },
			marketTransaction: { id: 1, status: 'COMPLETED' }
		};

		const userStateService = require('../../service/user-state-service');
		const marketService = require('../../service/market-service');

		userStateService.getUserState.mockResolvedValueOnce(mockUserState).mockResolvedValueOnce(mockUpdatedUserState);
		userStateService.updateUserState.mockResolvedValue(mockUpdatedUserState);
		marketService.registerOffer.mockResolvedValue(mockMarketResult);

		const result = await gameService.claimDailyReward(userId);

		expect(result.success).toBe(true);
		expect(result.data.currentStreak).toBe(3);
		expect(result.data.rewards).toHaveLength(1); // only darkmatter on day 3
		expect(marketService.registerOffer).toHaveBeenCalledTimes(1);
	});

	it('should reset streak when claiming after missing a day', async () => {
		const userId = 123;
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
		
		const mockUserState = {
			id: 1,
			userId: userId,
			stardust: 100,
			darkMatter: 50,
			stars: 25,
			lastDailyBonus: twoDaysAgo,
			currentStreak: 5,
			maxStreak: 5
		};

		const mockUpdatedUserState = {
			...mockUserState,
			stardust: 200,
			darkMatter: 75,
			lastDailyBonus: new Date(),
			currentStreak: 1,
			maxStreak: 5
		};

		const mockMarketResult = {
			offer: { id: 1 },
			marketTransaction: { id: 1, status: 'COMPLETED' }
		};

		const userStateService = require('../../service/user-state-service');
		const marketService = require('../../service/market-service');

		userStateService.getUserState.mockResolvedValueOnce(mockUserState).mockResolvedValueOnce(mockUpdatedUserState);
		userStateService.updateUserState.mockResolvedValue(mockUpdatedUserState);
		marketService.registerOffer.mockResolvedValue(mockMarketResult);

		const result = await gameService.claimDailyReward(userId);

		expect(result.success).toBe(true);
		expect(result.data.currentStreak).toBe(1);
		expect(result.data.maxStreak).toBe(5);
		expect(result.data.rewards).toHaveLength(2); // stardust and darkmatter
	});

	it('should throw error if daily reward already claimed today', async () => {
		const userId = 123;
		const today = new Date();
		
		const mockUserState = {
			id: 1,
			userId: userId,
			stardust: 100,
			darkMatter: 50,
			stars: 25,
			lastDailyBonus: today,
			currentStreak: 1,
			maxStreak: 1
		};

		const userStateService = require('../../service/user-state-service');

		userStateService.getUserState.mockResolvedValue(mockUserState);

		await expect(gameService.claimDailyReward(userId)).rejects.toThrow('Daily reward already claimed today');
	});

	it('should handle database errors gracefully', async () => {
		const userId = 123;
		
		const userStateService = require('../../service/user-state-service');

		userStateService.getUserState.mockRejectedValue(new Error('Database connection failed'));

		await expect(gameService.claimDailyReward(userId)).rejects.toThrow('Failed to claim daily reward: Database connection failed');
	});
});
