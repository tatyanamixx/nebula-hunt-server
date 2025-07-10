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
				{ transaction: expect.anything() }
			);

			expect(MarketOffer.create).toHaveBeenCalledWith(
				expect.objectContaining({
					sellerId: SYSTEM_USER_ID,
					itemType: 'artifact',
					itemId: mockArtifact.id,
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
			};

			// Setup mocks to throw an error
			const mockError = new Error('Database error');
			Artifact.create.mockRejectedValue(mockError);

			// Mock transaction
			const mockTransaction = {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
			};
			sequelize.transaction.mockResolvedValue(mockTransaction);

			// Call the method and expect it to throw
			await expect(
				artifactService.createSystemArtifactWithOffer(artifactData, 1, {
					price: 100,
					currency: 'tgStars',
				})
			).rejects.toThrow('Failed to create system artifact with offer');

			// Verify transaction was rolled back
			expect(mockTransaction.rollback).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
		});

		it('should set tradable to true by default', async () => {
			// Mock data without tradable field
			const artifactData = {
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				description: 'Special artifact from the system',
				rarity: 'MYTHICAL',
				image: 'system-artifact.jpg',
				effects: { special: 200 },
				// tradable not specified
			};

			const mockArtifact = {
				id: 10,
				userId: SYSTEM_USER_ID,
				...artifactData,
				tradable: true,
			};

			// Setup minimal mocks for this test
			Artifact.create.mockResolvedValue(mockArtifact);
			MarketOffer.create.mockResolvedValue({ id: 20 });
			MarketTransaction.create.mockResolvedValue({ id: 30 });
			PaymentTransaction.create.mockResolvedValue({ id: 40 });

			// Call the method
			await artifactService.createSystemArtifactWithOffer(
				artifactData,
				5,
				{ price: 1000, currency: 'tgStars' }
			);

			// Assertions
			expect(Artifact.create).toHaveBeenCalledWith(
				expect.objectContaining({
					tradable: true,
				}),
				expect.anything()
			);
		});

		it('should respect tradable=false if specified', async () => {
			// Mock data with tradable explicitly set to false
			const artifactData = {
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				description: 'Special artifact from the system',
				rarity: 'MYTHICAL',
				image: 'system-artifact.jpg',
				effects: { special: 200 },
				tradable: false,
			};

			const mockArtifact = {
				id: 10,
				userId: SYSTEM_USER_ID,
				...artifactData,
			};

			// Setup minimal mocks for this test
			Artifact.create.mockResolvedValue(mockArtifact);
			MarketOffer.create.mockResolvedValue({ id: 20 });
			MarketTransaction.create.mockResolvedValue({ id: 30 });
			PaymentTransaction.create.mockResolvedValue({ id: 40 });

			// Call the method
			await artifactService.createSystemArtifactWithOffer(
				artifactData,
				5,
				{ price: 1000, currency: 'tgStars' }
			);

			// Assertions
			expect(Artifact.create).toHaveBeenCalledWith(
				expect.objectContaining({
					tradable: false,
				}),
				expect.anything()
			);
		});
	});
});
