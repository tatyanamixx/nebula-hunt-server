const marketService = require('../../service/market-service');
const packageStoreService = require('../../service/package-store-service');
const { MarketOffer } = require('../../models/models');
const sequelize = require('../../db');

// Мокаем модели и другие зависимости
jest.mock('../../models/models', () => ({
	MarketOffer: {
		findAll: jest.fn(),
		findByPk: jest.fn(),
	},
}));

jest.mock('../../db', () => ({
	transaction: jest.fn(() => ({
		commit: jest.fn(),
		rollback: jest.fn(),
	})),
}));

jest.mock('../../service/package-store-service', () => ({
	initializePackageStore: jest.fn().mockResolvedValue([]),
}));

describe('MarketService', () => {
	beforeEach(() => {
		// Очищаем моки перед каждым тестом
		jest.clearAllMocks();
	});

	describe('getPackageOffers', () => {
		it('should get package offers successfully', async () => {
			// Mock данных
			const mockOffers = [
				{
					id: 1,
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
				{
					id: 2,
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
			];
			MarketOffer.findAll.mockResolvedValue(mockOffers);

			// Вызываем тестируемый метод
			const result = await marketService.getPackageOffers();

			// Проверяем, что были вызваны нужные методы
			expect(MarketOffer.findAll).toHaveBeenCalledWith({
				where: {
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
				transaction: expect.anything(),
			});
			expect(result).toEqual(mockOffers);
		});

		it('should get package offers with userId parameter', async () => {
			// Mock данных
			const mockOffers = [
				{
					id: 1,
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
				{
					id: 2,
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
			];
			MarketOffer.findAll.mockResolvedValue(mockOffers);

			const userId = 12345;

			// Вызываем тестируемый метод
			const result = await marketService.getPackageOffers(userId);

			// Проверяем, что были вызваны нужные методы
			expect(packageStoreService.initializePackageStore).toHaveBeenCalledWith(
				userId,
				expect.anything()
			);
			expect(MarketOffer.findAll).toHaveBeenCalledWith({
				where: {
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
				transaction: expect.anything(),
			});
			expect(result).toEqual(mockOffers);
		});

		it('should handle errors gracefully', async () => {
			// Mock ошибки
			MarketOffer.findAll.mockRejectedValue(new Error('Database error'));

			// Проверяем, что метод выбрасывает ошибку
			await expect(marketService.getPackageOffers()).rejects.toThrow(
				'Failed to get package offers: Database error'
			);
		});
	});
});
