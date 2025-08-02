/**
 * Простой тест для Game Service с моками
 */
const GameService = require('../../service/game-service');

// Мокаем все зависимости
jest.mock('../../models/models');
jest.mock('../../db');
jest.mock('../../service/logger-service');
jest.mock('../../service/market-service');
jest.mock('../../service/user-state-service');

describe('Game Service Simple Tests', () => {
	let gameService;
	let marketService;
	let userStateService;

	beforeEach(() => {
		// Очищаем все моки
		jest.clearAllMocks();
		
		// Получаем экземпляры сервисов
		gameService = new GameService();
		marketService = require('../../service/market-service');
		userStateService = require('../../service/user-state-service');
	});

	describe('registerFarmingReward', () => {
		const mockUserId = 123456789;
		const mockOfferData = [
			{
				resource: 'stardust',
				amount: 75
			},
			{
				resource: 'darkMatter',
				amount: 25
			}
		];

		beforeEach(() => {
			// Настраиваем моки
			userStateService.getUserState.mockResolvedValue({
				id: 1,
				userId: mockUserId,
				stardust: 75,
				darkMatter: 25,
				stars: 100,
			});

			marketService.registerOffer.mockResolvedValue({
				offer: {
					id: 1,
				},
				marketTransaction: {
					id: 1,
				}
			});
		});

		test('should register farming reward successfully', async () => {
			const result = await gameService.registerFarmingReward(
				mockUserId,
				mockOfferData
			);

			// Проверяем результат
			expect(result).toEqual({
				success: true,
				message: 'Farming rewards transferred to user successfully',
				data: {
					rewards: [
						{
							resource: 'stardust',
							amount: 75,
							success: true,
							offerId: 1,
							marketTransactionId: 1,
						},
						{
							resource: 'darkMatter',
							amount: 25,
							success: true,
							offerId: 1,
							marketTransactionId: 1,
						}
					],
					userState: {
						stardust: 75,
						darkMatter: 25,
						stars: 100,
					},
				},
			});

			// Проверяем, что marketService.registerOffer был вызван дважды
			expect(marketService.registerOffer).toHaveBeenCalledTimes(2);
		});

		test('should validate array structure', async () => {
			const invalidData = { resource: 'stardust', amount: 75 };

			await expect(
				gameService.registerFarmingReward(mockUserId, invalidData)
			).rejects.toThrow('Farming data must be an array with exactly 2 elements');
		});

		test('should validate array length', async () => {
			const invalidData = [
				{ resource: 'stardust', amount: 75 }
			];

			await expect(
				gameService.registerFarmingReward(mockUserId, invalidData)
			).rejects.toThrow('Farming data must be an array with exactly 2 elements');
		});

		test('should validate required fields', async () => {
			const invalidData = [
				{ resource: 'stardust' }, // missing amount
				{ resource: 'darkMatter', amount: 25 }
			];

			await expect(
				gameService.registerFarmingReward(mockUserId, invalidData)
			).rejects.toThrow('Each farming reward must have resource and amount');
		});

		test('should validate resource types', async () => {
			const invalidData = [
				{ resource: 'invalid', amount: 75 },
				{ resource: 'darkMatter', amount: 25 }
			];

			await expect(
				gameService.registerFarmingReward(mockUserId, invalidData)
			).rejects.toThrow('Invalid resource: invalid. Must be one of: stardust, darkMatter');
		});

		test('should validate positive amounts', async () => {
			const invalidData = [
				{ resource: 'stardust', amount: -75 },
				{ resource: 'darkMatter', amount: 25 }
			];

			await expect(
				gameService.registerFarmingReward(mockUserId, invalidData)
			).rejects.toThrow('Amount must be positive for resource: stardust');
		});

		test('should prevent duplicate resources', async () => {
			const invalidData = [
				{ resource: 'stardust', amount: 75 },
				{ resource: 'stardust', amount: 25 }
			];

			await expect(
				gameService.registerFarmingReward(mockUserId, invalidData)
			).rejects.toThrow('Duplicate resource: stardust');
		});

		test('should require both stardust and darkMatter', async () => {
			const invalidData = [
				{ resource: 'stardust', amount: 75 },
				{ resource: 'stars', amount: 25 }
			];

			await expect(
				gameService.registerFarmingReward(mockUserId, invalidData)
			).rejects.toThrow('Farming data must include both stardust and darkMatter');
		});

		test('should call marketService with correct parameters', async () => {
			await gameService.registerFarmingReward(mockUserId, mockOfferData);

			// Проверяем первый вызов для stardust
			expect(marketService.registerOffer).toHaveBeenNthCalledWith(1, {
				sellerId: -1, // SYSTEM_USER_ID
				buyerId: mockUserId,
				txType: 'FARMING_REWARD',
				itemType: 'resource',
				itemId: 'stardust_75',
				price: 0,
				currency: 'tonToken',
				amount: 75,
				resource: 'stardust',
				offerType: 'SYSTEM',
			}, expect.any(Object));

			// Проверяем второй вызов для darkMatter
			expect(marketService.registerOffer).toHaveBeenNthCalledWith(2, {
				sellerId: -1, // SYSTEM_USER_ID
				buyerId: mockUserId,
				txType: 'FARMING_REWARD',
				itemType: 'resource',
				itemId: 'darkMatter_25',
				price: 0,
				currency: 'tonToken',
				amount: 25,
				resource: 'darkMatter',
				offerType: 'SYSTEM',
			}, expect.any(Object));
		});

		test('should handle marketService errors', async () => {
			marketService.registerOffer.mockRejectedValue(
				new Error('Market service error')
			);

			await expect(
				gameService.registerFarmingReward(mockUserId, mockOfferData)
			).rejects.toThrow('Market service error');
		});

		test('should handle userStateService errors', async () => {
			userStateService.getUserState.mockRejectedValue(
				new Error('User state service error')
			);

			await expect(
				gameService.registerFarmingReward(mockUserId, mockOfferData)
			).rejects.toThrow('User state service error');
		});
	});
}); 