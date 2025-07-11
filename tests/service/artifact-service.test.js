const artifactService = require('../../service/artifact-service');
const {
	Artifact,
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
} = require('../../models/models');
const sequelize = require('../../db');
const { SYSTEM_USER_ID } = require('../../config/constants');

// Mock the models and sequelize
jest.mock('../../models/models', () => {
	const mockArtifact = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
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
		Artifact: mockArtifact,
		MarketOffer: mockMarketOffer,
		MarketTransaction: mockMarketTransaction,
		PaymentTransaction: mockPaymentTransaction,
	};
});

jest.mock('../../db', () => {
	return {
		transaction: jest.fn(),
	};
});

jest.mock('../../config/constants', () => ({
	SYSTEM_USER_ID: 999,
}));

describe('ArtifactService', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Mock transaction
		sequelize.transaction.mockImplementation(() => {
			return {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
			};
		});
	});

	describe('addArtifactToUser', () => {
		it('should create a new artifact for user', async () => {
			// Mock data
			const artifactData = {
				userId: 1,
				seed: 'artifact-seed-123',
				name: 'Ancient Relic',
				description: 'A mysterious artifact from ancient times',
				rarity: 'LEGENDARY',
				image: 'artifact.jpg',
				effects: { power: 100, luck: 50 },
				tradable: true,
			};

			const mockCreatedArtifact = {
				id: 1,
				...artifactData,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Setup mocks
			Artifact.create.mockResolvedValue(mockCreatedArtifact);

			// Call the method
			const result = await artifactService.addArtifactToUser(
				artifactData
			);

			// Assertions
			expect(Artifact.create).toHaveBeenCalledWith(artifactData);
			expect(result).toEqual(mockCreatedArtifact);
		});

		it('should set tradable to true by default', async () => {
			// Mock data without tradable field
			const artifactData = {
				userId: 1,
				seed: 'artifact-seed-123',
				name: 'Ancient Relic',
				description: 'A mysterious artifact from ancient times',
				rarity: 'LEGENDARY',
				image: 'artifact.jpg',
				effects: { power: 100, luck: 50 },
			};

			const mockCreatedArtifact = {
				id: 1,
				...artifactData,
				tradable: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Setup mocks
			Artifact.create.mockResolvedValue(mockCreatedArtifact);

			// Call the method
			const result = await artifactService.addArtifactToUser(
				artifactData
			);

			// Assertions
			expect(Artifact.create).toHaveBeenCalledWith({
				...artifactData,
				tradable: true,
			});
			expect(result.tradable).toBe(true);
		});
	});

	describe('getUserArtifacts', () => {
		it('should return all artifacts for a user', async () => {
			// Mock data
			const userId = 1;
			const mockArtifacts = [
				{
					id: 1,
					userId,
					seed: 'artifact-seed-123',
					name: 'Ancient Relic',
					rarity: 'LEGENDARY',
					effects: { power: 100 },
				},
				{
					id: 2,
					userId,
					seed: 'artifact-seed-456',
					name: 'Magic Crystal',
					rarity: 'RARE',
					effects: { magic: 75 },
				},
			];

			// Setup mocks
			Artifact.findAll.mockResolvedValue(mockArtifacts);

			// Call the method
			const result = await artifactService.getUserArtifacts(userId);

			// Assertions
			expect(Artifact.findAll).toHaveBeenCalledWith({
				where: { userId },
			});
			expect(result).toEqual(mockArtifacts);
			expect(result.length).toBe(2);
		});

		it('should return empty array when user has no artifacts', async () => {
			// Setup mocks
			Artifact.findAll.mockResolvedValue([]);

			// Call the method
			const result = await artifactService.getUserArtifacts(5);

			// Assertions
			expect(result).toEqual([]);
		});
	});

	describe('getArtifactById', () => {
		it('should return an artifact by ID', async () => {
			// Mock data
			const artifactId = 1;
			const userId = 1;
			const mockArtifact = {
				id: artifactId,
				userId,
				seed: 'artifact-seed-123',
				name: 'Ancient Relic',
				rarity: 'LEGENDARY',
				effects: { power: 100 },
			};

			// Setup mocks
			Artifact.findOne.mockResolvedValue(mockArtifact);

			// Call the method
			const result = await artifactService.getArtifactById(
				artifactId,
				userId
			);

			// Assertions
			expect(Artifact.findOne).toHaveBeenCalledWith({
				where: { id: artifactId },
			});
			expect(result).toEqual(mockArtifact);
		});

		it('should return null when artifact not found', async () => {
			// Setup mocks
			Artifact.findOne.mockResolvedValue(null);

			// Call the method
			const result = await artifactService.getArtifactById(999, 1);

			// Assertions
			expect(result).toBeNull();
		});

		it('should throw error when user does not own the artifact', async () => {
			// Mock data
			const artifactId = 1;
			const userId = 1;
			const differentUserId = 2;
			const mockArtifact = {
				id: artifactId,
				userId: differentUserId, // Different from the requesting user
				seed: 'artifact-seed-123',
				name: 'Ancient Relic',
				rarity: 'LEGENDARY',
				effects: { power: 100 },
			};

			// Setup mocks
			Artifact.findOne.mockResolvedValue(mockArtifact);

			// Call the method and expect it to throw
			await expect(
				artifactService.getArtifactById(artifactId, userId)
			).rejects.toThrow(
				'You do not have permission to access this artifact'
			);
		});

		it('should allow access to system artifacts', async () => {
			// Mock data
			const artifactId = 1;
			const userId = 1;
			const mockArtifact = {
				id: artifactId,
				userId: SYSTEM_USER_ID, // System user
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				rarity: 'MYTHICAL',
				effects: { special: 200 },
			};

			// Setup mocks
			Artifact.findOne.mockResolvedValue(mockArtifact);

			// Call the method
			const result = await artifactService.getArtifactById(
				artifactId,
				userId
			);

			// Assertions
			expect(result).toEqual(mockArtifact);
		});
	});

	describe('generateRandomArtifact', () => {
		it('should generate a random artifact for user', async () => {
			// Mock data
			const userId = 1;
			const mockArtifact = {
				id: 3,
				userId,
				seed: 'generated-seed-789',
				name: 'Cosmic Crystal',
				rarity: 'EPIC',
				effects: { chaos: 0.2, stability: 0.15 },
				tradable: true,
			};

			// Setup mocks
			Artifact.create.mockResolvedValue(mockArtifact);

			// Call the method
			const result = await artifactService.generateRandomArtifact(userId);

			// Assertions
			expect(Artifact.create).toHaveBeenCalled();
			expect(result).toEqual(mockArtifact);

			// Check that create was called with userId
			const createCall = Artifact.create.mock.calls[0][0];
			expect(createCall.userId).toBe(userId);

			// Check that required fields are present
			expect(createCall.seed).toBeDefined();
			expect(createCall.name).toBeDefined();
			expect(createCall.rarity).toBeDefined();
			expect(createCall.effects).toBeDefined();
			expect(createCall.tradable).toBe(true);
		});
	});

	describe('activateArtifact', () => {
		it('should activate an artifact', async () => {
			// Mock data
			const artifactId = 1;
			const userId = 1;
			const mockArtifact = {
				id: artifactId,
				userId,
				name: 'Ancient Relic',
				effects: { power: 100 },
			};

			// Setup mocks
			Artifact.findOne.mockResolvedValue(mockArtifact);

			// Call the method
			const result = await artifactService.activateArtifact(
				artifactId,
				userId
			);

			// Assertions
			expect(Artifact.findOne).toHaveBeenCalledWith({
				where: { id: artifactId },
			});
			expect(result.success).toBe(true);
			expect(result.message).toContain('has been activated');
			expect(result.effects).toEqual(mockArtifact.effects);
		});

		it('should throw error when artifact not found', async () => {
			// Setup mocks
			Artifact.findOne.mockResolvedValue(null);

			// Call the method and expect it to throw
			await expect(
				artifactService.activateArtifact(999, 1)
			).rejects.toThrow('Artifact not found');
		});

		it('should throw error when user does not own the artifact', async () => {
			// Mock data
			const artifactId = 1;
			const userId = 1;
			const differentUserId = 2;
			const mockArtifact = {
				id: artifactId,
				userId: differentUserId, // Different from the requesting user
				name: 'Ancient Relic',
				effects: { power: 100 },
			};

			// Setup mocks
			Artifact.findOne.mockResolvedValue(mockArtifact);

			// Call the method and expect it to throw
			await expect(
				artifactService.activateArtifact(artifactId, userId)
			).rejects.toThrow('You can only activate artifacts that you own');
		});
	});

	describe('deactivateArtifact', () => {
		it('should deactivate an artifact', async () => {
			// Mock data
			const artifactId = 1;
			const userId = 1;
			const mockArtifact = {
				id: artifactId,
				userId,
				name: 'Ancient Relic',
				effects: { power: 100 },
			};

			// Setup mocks
			Artifact.findOne.mockResolvedValue(mockArtifact);

			// Call the method
			const result = await artifactService.deactivateArtifact(
				artifactId,
				userId
			);

			// Assertions
			expect(Artifact.findOne).toHaveBeenCalledWith({
				where: { id: artifactId },
			});
			expect(result.success).toBe(true);
			expect(result.message).toContain('has been deactivated');
			expect(result.effects).toEqual(mockArtifact.effects);
		});

		it('should throw error when artifact not found', async () => {
			// Setup mocks
			Artifact.findOne.mockResolvedValue(null);

			// Call the method and expect it to throw
			await expect(
				artifactService.deactivateArtifact(999, 1)
			).rejects.toThrow('Artifact not found');
		});

		it('should throw error when user does not own the artifact', async () => {
			// Mock data
			const artifactId = 1;
			const userId = 1;
			const differentUserId = 2;
			const mockArtifact = {
				id: artifactId,
				userId: differentUserId, // Different from the requesting user
				name: 'Ancient Relic',
				effects: { power: 100 },
			};

			// Setup mocks
			Artifact.findOne.mockResolvedValue(mockArtifact);

			// Call the method and expect it to throw
			await expect(
				artifactService.deactivateArtifact(artifactId, userId)
			).rejects.toThrow('You can only deactivate artifacts that you own');
		});
	});

	describe('createSystemArtifactWithOffer', () => {
		it('should create a system artifact with offer and transaction', async () => {
			// Mock data
			const artifactData = {
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				description: 'Special artifact from the system',
				rarity: 'MYTHICAL',
				image: 'system-artifact.jpg',
				effects: { special: 200 },
				tradable: true,
			};

			const buyerId = 5;
			const offerData = {
				price: 1000,
				currency: 'tgStars',
				expiresAt: new Date(Date.now() + 86400000), // 1 day from now
			};

			const mockArtifact = {
				id: 10,
				userId: SYSTEM_USER_ID,
				...artifactData,
			};

			const mockOffer = {
				id: 20,
				sellerId: SYSTEM_USER_ID,
				itemType: 'artifact',
				itemId: 10,
				price: 1000,
				currency: 'tgStars',
			};

			const mockTransaction = {
				id: 30,
				offerId: 20,
				buyerId: 5,
				sellerId: SYSTEM_USER_ID,
			};

			const mockPayment = {
				id: 40,
				marketTransactionId: 30,
				fromAccount: 5,
				toAccount: SYSTEM_USER_ID,
				amount: 1000,
				currency: 'tgStars',
			};

			// Setup mocks
			Artifact.create.mockResolvedValue(mockArtifact);
			MarketOffer.create.mockResolvedValue(mockOffer);
			MarketTransaction.create.mockResolvedValue(mockTransaction);
			PaymentTransaction.create.mockResolvedValue(mockPayment);

			// Call the method
			const result = await artifactService.createSystemArtifactWithOffer(
				artifactData,
				buyerId,
				offerData
			);

			// Assertions
			expect(Artifact.create).toHaveBeenCalledWith(
				{
					userId: SYSTEM_USER_ID,
					seed: artifactData.seed,
					name: artifactData.name,
					description: artifactData.description,
					rarity: artifactData.rarity,
					image: artifactData.image,
					effects: artifactData.effects,
					tradable: true,
				},
				expect.anything()
			);

			expect(MarketOffer.create).toHaveBeenCalledWith(
				{
					sellerId: SYSTEM_USER_ID,
					itemType: 'artifact',
					itemId: mockArtifact.id,
					price: offerData.price,
					currency: offerData.currency,
					offerType: 'SYSTEM',
					expiresAt: offerData.expiresAt,
					status: 'ACTIVE',
				},
				expect.anything()
			);

			expect(MarketTransaction.create).toHaveBeenCalledWith(
				{
					offerId: mockOffer.id,
					buyerId: buyerId,
					sellerId: SYSTEM_USER_ID,
					status: 'PENDING',
				},
				expect.anything()
			);

			expect(PaymentTransaction.create).toHaveBeenCalledWith(
				{
					marketTransactionId: mockTransaction.id,
					fromAccount: buyerId,
					toAccount: SYSTEM_USER_ID,
					amount: offerData.price,
					currency: offerData.currency,
					txType: 'BUYER_TO_CONTRACT',
					status: 'PENDING',
				},
				expect.anything()
			);

			expect(result).toEqual({
				artifact: mockArtifact,
				offer: mockOffer,
				transaction: mockTransaction,
				payment: mockPayment,
			});
		});

		it('should handle errors and rollback transaction', async () => {
			// Mock data
			const artifactData = {
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				rarity: 'MYTHICAL',
			};

			const buyerId = 5;
			const offerData = {
				price: 1000,
				currency: 'tgStars',
			};

			// Setup mocks to simulate an error
			const mockTransaction = {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
			};
			sequelize.transaction.mockResolvedValue(mockTransaction);

			const error = new Error('Database error');
			Artifact.create.mockRejectedValue(error);

			// Call the method and expect it to throw
			await expect(
				artifactService.createSystemArtifactWithOffer(
					artifactData,
					buyerId,
					offerData
				)
			).rejects.toThrow('Failed to create system artifact with offer');

			// Verify that rollback was called
			expect(mockTransaction.rollback).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
		});

		it('should set tradable to true by default', async () => {
			// Mock data without tradable field
			const artifactData = {
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				rarity: 'MYTHICAL',
			};

			const buyerId = 5;
			const offerData = {
				price: 1000,
				currency: 'tgStars',
			};

			// Setup mocks
			const mockArtifact = {
				id: 10,
				userId: SYSTEM_USER_ID,
				...artifactData,
				tradable: true,
			};
			Artifact.create.mockResolvedValue(mockArtifact);
			MarketOffer.create.mockResolvedValue({});
			MarketTransaction.create.mockResolvedValue({});
			PaymentTransaction.create.mockResolvedValue({});

			// Call the method
			await artifactService.createSystemArtifactWithOffer(
				artifactData,
				buyerId,
				offerData
			);

			// Assertions
			expect(Artifact.create).toHaveBeenCalledWith(
				expect.objectContaining({ tradable: true }),
				expect.anything()
			);
		});

		it('should respect tradable=false if specified', async () => {
			// Mock data with tradable=false
			const artifactData = {
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				rarity: 'MYTHICAL',
				tradable: false,
			};

			const buyerId = 5;
			const offerData = {
				price: 1000,
				currency: 'tgStars',
			};

			// Setup mocks
			const mockArtifact = {
				id: 10,
				userId: SYSTEM_USER_ID,
				...artifactData,
				tradable: false,
			};
			Artifact.create.mockResolvedValue(mockArtifact);
			MarketOffer.create.mockResolvedValue({});
			MarketTransaction.create.mockResolvedValue({});
			PaymentTransaction.create.mockResolvedValue({});

			// Call the method
			await artifactService.createSystemArtifactWithOffer(
				artifactData,
				buyerId,
				offerData
			);

			// Assertions
			expect(Artifact.create).toHaveBeenCalledWith(
				expect.objectContaining({ tradable: false }),
				expect.anything()
			);
		});
	});
});
