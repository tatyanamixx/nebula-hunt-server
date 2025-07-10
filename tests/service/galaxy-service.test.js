const galaxyService = require('../../service/galaxy-service');
const {
	User,
	Galaxy,
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
} = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const { Op } = require('sequelize');
const { SYSTEM_USER_ID } = require('../../config/constants');

// Mock the models and sequelize
jest.mock('../../models/models', () => {
	const mockUser = {
		findOne: jest.fn(),
		findByPk: jest.fn(),
	};

	const mockGalaxy = {
		findAll: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		findOrCreate: jest.fn(),
		count: jest.fn(),
	};

	const mockMarketOffer = {
		create: jest.fn(),
	};

	const mockMarketTransaction = {
		create: jest.fn(),
	};

	const mockPaymentTransaction = {
		create: jest.fn(),
	};

	return {
		User: mockUser,
		Galaxy: mockGalaxy,
		MarketOffer: mockMarketOffer,
		MarketTransaction: mockMarketTransaction,
		PaymentTransaction: mockPaymentTransaction,
	};
});

jest.mock('../../service/logger-service', () => ({
	info: jest.fn(),
}));

jest.mock('../../db');
jest.mock('sequelize');

describe('GalaxyService', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Mock transaction
		sequelize.transaction.mockImplementation(() => {
			return {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
				finished: false,
			};
		});

		// Mock sequelize.random
		sequelize.random = jest.fn().mockReturnValue('RANDOM()');
	});

	describe('getUserGalaxies', () => {
		it('should return user galaxies ordered by starCurrent DESC', async () => {
			// Mock data
			const userId = 1;
			const mockGalaxies = [
				{
					id: 1,
					userId,
					seed: 'seed1',
					starCurrent: 200,
					toJSON: () => ({
						id: 1,
						userId,
						seed: 'seed1',
						starCurrent: 200,
					}),
				},
				{
					id: 2,
					userId,
					seed: 'seed2',
					starCurrent: 150,
					toJSON: () => ({
						id: 2,
						userId,
						seed: 'seed2',
						starCurrent: 150,
					}),
				},
			];

			// Setup mocks
			Galaxy.findAll.mockResolvedValue(mockGalaxies);

			// Call the method
			const result = await galaxyService.getUserGalaxies(userId);

			// Assertions
			expect(Galaxy.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['starCurrent', 'DESC']],
				transaction: expect.anything(),
			});
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe(1);
			expect(result[1].id).toBe(2);
			expect(sequelize.transaction).toHaveBeenCalled();
		});

		it('should return empty array if no galaxies found', async () => {
			// Setup mocks
			Galaxy.findAll.mockResolvedValue(null);

			// Call the method
			const result = await galaxyService.getUserGalaxies(1);

			// Assertions
			expect(result).toEqual([]);
		});

		it('should handle errors properly', async () => {
			// Mock an error
			const mockError = new Error('Database error');
			Galaxy.findAll.mockRejectedValue(mockError);

			// Call the method and expect it to throw
			await expect(galaxyService.getUserGalaxies(1)).rejects.toThrow(
				ApiError
			);
		});
	});

	describe('getGalaxy', () => {
		it('should return a galaxy by id with user info', async () => {
			// Mock data
			const galaxyId = 1;
			const mockGalaxy = {
				id: galaxyId,
				userId: 1,
				seed: 'seed1',
				starCurrent: 200,
				user: {
					username: 'testuser',
					role: 'USER',
					id: 1,
				},
			};

			// Setup mocks
			Galaxy.findByPk.mockResolvedValue(mockGalaxy);

			// Call the method
			const result = await galaxyService.getGalaxy(galaxyId);

			// Assertions
			expect(Galaxy.findByPk).toHaveBeenCalledWith(galaxyId, {
				include: [
					{
						model: User,
						attributes: ['username', 'role', 'id'],
					},
				],
				transaction: expect.anything(),
			});
			expect(result).toEqual(mockGalaxy);
		});

		it('should throw an error if galaxy not found', async () => {
			// Setup mocks
			Galaxy.findByPk.mockResolvedValue(null);

			// Call the method and expect it to throw
			await expect(galaxyService.getGalaxy(1)).rejects.toThrow(
				'Galaxy not found'
			);
		});
	});

	describe('createGalaxy', () => {
		it('should create a new galaxy', async () => {
			// Mock data
			const userId = 1;
			const galaxyData = {
				seed: 'seed1',
				starMin: 150,
				starCurrent: 200,
				price: 300,
				particleCount: 120,
				onParticleCountChange: true,
				galaxyProperties: { color: 'blue' },
			};

			const mockGalaxy = {
				id: 1,
				userId,
				...galaxyData,
			};

			// Setup mocks
			Galaxy.findOrCreate.mockResolvedValue([mockGalaxy, true]);

			// Call the method
			const result = await galaxyService.createGalaxy(userId, galaxyData);

			// Assertions
			expect(Galaxy.findOrCreate).toHaveBeenCalledWith({
				where: {
					seed: galaxyData.seed,
				},
				defaults: {
					userId,
					starMin: galaxyData.starMin,
					starCurrent: galaxyData.starCurrent,
					price: galaxyData.price,
					seed: galaxyData.seed,
					particleCount: galaxyData.particleCount,
					onParticleCountChange: galaxyData.onParticleCountChange,
					galaxyProperties: galaxyData.galaxyProperties,
					active: true,
				},
				transaction: expect.anything(),
			});
			expect(result).toEqual(mockGalaxy);
		});

		it('should use default values when not provided', async () => {
			// Mock data
			const userId = 1;
			const galaxyData = {
				seed: 'seed1',
				galaxyProperties: { color: 'blue' },
			};

			const mockGalaxy = {
				id: 1,
				userId,
				seed: 'seed1',
				starMin: 100,
				starCurrent: 100,
				price: 100,
				particleCount: 100,
				onParticleCountChange: true,
				galaxyProperties: { color: 'blue' },
				active: true,
			};

			// Setup mocks
			Galaxy.findOrCreate.mockResolvedValue([mockGalaxy, true]);

			// Call the method
			const result = await galaxyService.createGalaxy(userId, galaxyData);

			// Assertions
			expect(Galaxy.findOrCreate).toHaveBeenCalledWith({
				where: {
					seed: galaxyData.seed,
				},
				defaults: expect.objectContaining({
					userId,
					starMin: 100,
					starCurrent: 100,
					price: 100,
					particleCount: 100,
				}),
				transaction: expect.anything(),
			});
			expect(result).toEqual(mockGalaxy);
		});

		it('should throw an error if galaxy data is invalid', async () => {
			// Mock data with missing required fields
			const userId = 1;
			const galaxyData = {
				// Missing seed and galaxyProperties
				starMin: 150,
			};

			// Call the method and expect it to throw
			await expect(
				galaxyService.createGalaxy(userId, galaxyData)
			).rejects.toThrow('Invalid galaxy data structure');
		});
	});

	describe('updateGalaxyStars', () => {
		it('should update galaxy star count and properties', async () => {
			// Mock data
			const galaxyData = {
				seed: 'seed1',
				starCurrent: 250,
				price: 300,
				particleCount: 150,
				onParticleCountChange: false,
				galaxyProperties: { color: 'green' },
			};

			const mockGalaxy = {
				id: 1,
				userId: 1,
				seed: 'seed1',
				starCurrent: 200,
				price: 200,
				particleCount: 100,
				onParticleCountChange: true,
				galaxyProperties: { color: 'blue' },
				save: jest.fn().mockResolvedValue(true),
			};

			const mockUser = {
				id: 1,
				username: 'testuser',
			};

			// Setup mocks
			Galaxy.findOne.mockResolvedValue(mockGalaxy);
			User.findOne.mockResolvedValue(mockUser);

			// Call the method
			const result = await galaxyService.updateGalaxyStars(galaxyData);

			// Assertions
			expect(Galaxy.findOne).toHaveBeenCalledWith(galaxyData.seed, {
				transaction: expect.anything(),
			});

			// Проверяем, что свойства были установлены
			expect(mockGalaxy.price).toBe(galaxyData.price);
			expect(mockGalaxy.particleCount).toBe(galaxyData.particleCount);
			expect(mockGalaxy.onParticleCountChange).toBe(
				galaxyData.onParticleCountChange
			);
			expect(mockGalaxy.galaxyProperties).toBe(
				galaxyData.galaxyProperties
			);

			expect(mockGalaxy.save).toHaveBeenCalledWith({
				transaction: expect.anything(),
			});

			expect(result).toBe(mockGalaxy);
		});

		it('should throw an error if galaxy not found', async () => {
			// Setup mocks
			Galaxy.findOne.mockResolvedValue(null);

			// Call the method and expect it to throw
			await expect(
				galaxyService.updateGalaxyStars({ seed: 'nonexistent' })
			).rejects.toThrow('Galaxy not found');
		});
	});

	describe('updateGalaxyOwner', () => {
		it('should update galaxy owner', async () => {
			// Mock data
			const galaxyData = {
				seed: 'seed1',
			};
			const newOwnerId = 2;

			const mockGalaxy = {
				id: 1,
				userId: 1,
				seed: 'seed1',
				save: jest.fn().mockResolvedValue(true),
			};

			const mockNewUser = {
				id: newOwnerId,
				username: 'newowner',
			};

			// Setup mocks
			Galaxy.findOne.mockResolvedValue(mockGalaxy);
			User.findByPk.mockResolvedValue(mockNewUser);

			// Call the method
			const result = await galaxyService.updateGalaxyOwner(
				galaxyData,
				newOwnerId
			);

			// Assertions
			expect(Galaxy.findOne).toHaveBeenCalledWith(galaxyData.seed, {
				transaction: expect.anything(),
			});

			expect(User.findByPk).toHaveBeenCalledWith(newOwnerId, {
				transaction: expect.anything(),
			});

			expect(mockGalaxy.userId).toBe(newOwnerId);
			expect(mockGalaxy.save).toHaveBeenCalledWith({
				transaction: expect.anything(),
			});

			expect(result).toBe(mockGalaxy);
		});

		it('should throw an error if galaxy not found', async () => {
			// Setup mocks
			Galaxy.findOne.mockResolvedValue(null);

			// Call the method and expect it to throw
			await expect(
				galaxyService.updateGalaxyOwner({ seed: 'nonexistent' }, 2)
			).rejects.toThrow('Galaxy not found');
		});

		it('should throw an error if new owner not found', async () => {
			// Setup mocks
			const mockGalaxy = {
				id: 1,
				userId: 1,
				seed: 'seed1',
			};

			Galaxy.findOne.mockResolvedValue(mockGalaxy);
			User.findByPk.mockResolvedValue(null);

			// Call the method and expect it to throw
			await expect(
				galaxyService.updateGalaxyOwner({ seed: 'seed1' }, 999)
			).rejects.toThrow('New owner not found');
		});
	});

	describe('batchCreateGalaxies', () => {
		it('should create multiple galaxies', async () => {
			// Mock data
			const userId = 1;
			const galaxiesData = [
				{
					seed: 'seed1',
					galaxyProperties: { color: 'blue' },
				},
				{
					seed: 'seed2',
					galaxyProperties: { color: 'red' },
				},
			];

			const mockGalaxies = [
				[
					{
						id: 1,
						userId,
						seed: 'seed1',
						galaxyProperties: { color: 'blue' },
					},
					true,
				],
				[
					{
						id: 2,
						userId,
						seed: 'seed2',
						galaxyProperties: { color: 'red' },
					},
					true,
				],
			];

			// Setup mocks
			Galaxy.findOrCreate.mockImplementation((options) => {
				const seed = options.where.seed;
				const galaxy = mockGalaxies.find((g) => g[0].seed === seed);
				return Promise.resolve(galaxy);
			});

			// Call the method
			const result = await galaxyService.batchCreateGalaxies(
				userId,
				galaxiesData
			);

			// Assertions
			expect(Galaxy.findOrCreate).toHaveBeenCalledTimes(2);
			expect(result).toEqual(mockGalaxies);
		});
	});

	describe('createSystemGalaxyWithOffer', () => {
		it('should create a system galaxy with offer and transaction', async () => {
			// Mock data
			const galaxyData = {
				seed: 'seed1',
				galaxyProperties: { color: 'blue' },
			};
			const buyerId = 2;
			const offerData = {
				price: 500,
				currency: 'tgStars',
				expiresAt: new Date(Date.now() + 86400000), // 1 day from now
			};

			const mockGalaxy = {
				id: 1,
				userId: SYSTEM_USER_ID,
				seed: 'seed1',
				galaxyProperties: { color: 'blue' },
			};

			const mockOffer = {
				id: 1,
				sellerId: SYSTEM_USER_ID,
				itemType: 'galaxy',
				itemId: 1,
				price: 500,
				currency: 'tgStars',
			};

			const mockTransaction = {
				id: 1,
				offerId: 1,
				buyerId: 2,
				sellerId: SYSTEM_USER_ID,
			};

			const mockPayment = {
				id: 1,
				marketTransactionId: 1,
				fromAccount: 2,
				toAccount: SYSTEM_USER_ID,
				amount: 500,
				currency: 'tgStars',
			};

			// Setup mocks
			Galaxy.findOrCreate.mockResolvedValue([mockGalaxy, true]);
			MarketOffer.create.mockResolvedValue(mockOffer);
			MarketTransaction.create.mockResolvedValue(mockTransaction);
			PaymentTransaction.create.mockResolvedValue(mockPayment);

			// Call the method
			const result = await galaxyService.createSystemGalaxyWithOffer(
				galaxyData,
				buyerId,
				offerData
			);

			// Assertions
			expect(Galaxy.findOrCreate).toHaveBeenCalledWith({
				where: {
					seed: galaxyData.seed,
				},
				defaults: expect.objectContaining({
					userId: SYSTEM_USER_ID,
				}),
				transaction: expect.anything(),
			});

			expect(MarketOffer.create).toHaveBeenCalledWith(
				expect.objectContaining({
					sellerId: SYSTEM_USER_ID,
					itemType: 'galaxy',
					itemId: mockGalaxy.id,
					price: offerData.price,
					currency: offerData.currency,
				}),
				expect.anything()
			);

			expect(MarketTransaction.create).toHaveBeenCalledWith(
				expect.objectContaining({
					offerId: mockOffer.id,
					buyerId,
					sellerId: SYSTEM_USER_ID,
				}),
				expect.anything()
			);

			expect(PaymentTransaction.create).toHaveBeenCalledWith(
				expect.objectContaining({
					marketTransactionId: mockTransaction.id,
					fromAccount: buyerId,
					toAccount: SYSTEM_USER_ID,
					amount: offerData.price,
					currency: offerData.currency,
				}),
				expect.anything()
			);

			expect(result).toEqual({
				galaxy: mockGalaxy,
				offer: mockOffer,
				transaction: mockTransaction,
				payment: mockPayment,
			});
		});

		it('should throw an error if galaxy already exists', async () => {
			// Setup mocks
			Galaxy.findOrCreate.mockResolvedValue([{}, false]);

			// Call the method and expect it to throw
			await expect(
				galaxyService.createSystemGalaxyWithOffer(
					{ seed: 'seed1', galaxyProperties: {} },
					1,
					{ price: 100, currency: 'tgStars' }
				)
			).rejects.toThrow('Galaxy already exists');
		});
	});

	describe('getShowGalaxies', () => {
		it('should return random galaxies with pagination info', async () => {
			// Mock data
			const userId = 1;
			const mockCount = 50;
			const itemsPerPage = 20;
			const mockGalaxies = Array(itemsPerPage)
				.fill()
				.map((_, i) => ({
					id: i + 1,
					userId: i + 2, // Different from the requesting user
					seed: `seed${i}`,
					active: true,
					user: {
						username: `user${i}`,
						role: 'USER',
						id: i + 2,
					},
					toJSON: () => ({
						id: i + 1,
						userId: i + 2,
						seed: `seed${i}`,
						active: true,
						user: {
							username: `user${i}`,
							role: 'USER',
							id: i + 2,
						},
					}),
				}));

			// Setup mocks
			Galaxy.count.mockResolvedValue(mockCount);
			Galaxy.findAll.mockResolvedValue(mockGalaxies);

			// Call the method
			const result = await galaxyService.getShowGalaxies(userId);

			// Assertions
			expect(Galaxy.count).toHaveBeenCalledWith({
				where: {
					userId: { [Op.ne]: userId },
					active: true,
				},
				transaction: expect.anything(),
			});

			expect(Galaxy.findAll).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						userId: { [Op.ne]: userId },
						active: true,
					},
					limit: itemsPerPage,
					include: [
						{
							model: User,
							attributes: ['username', 'role', 'id'],
						},
					],
					transaction: expect.anything(),
				})
			);

			expect(result).toHaveProperty('info');
			expect(result).toHaveProperty('galaxies');
			expect(result.galaxies).toHaveLength(itemsPerPage);
			expect(result.info).toEqual(
				expect.objectContaining({
					count: mockCount,
					itemsPerPage,
				})
			);
		});

		it('should return empty result when no galaxies are available', async () => {
			// Setup mocks
			Galaxy.count.mockResolvedValue(0);

			// Call the method
			const result = await galaxyService.getShowGalaxies(1);

			// Assertions
			expect(result).toEqual({
				info: { count: 0, page: 0 },
				galaxies: [],
			});
			expect(Galaxy.findAll).not.toHaveBeenCalled();
		});

		it('should handle errors properly', async () => {
			// Mock an error
			const mockError = new Error('Database error');
			Galaxy.count.mockRejectedValue(mockError);

			// Call the method and expect it to throw
			await expect(galaxyService.getShowGalaxies(1)).rejects.toThrow(
				ApiError
			);
		});
	});
});
