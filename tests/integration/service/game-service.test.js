const GameService = require('../../../service/game-service');
const UserService = require('../../../service/user-service');
const { User, UserState, MarketOffer, MarketTransaction } = require('../../../models/models');
const { SYSTEM_USER_ID } = require('../../../config/constants');

describe('Game Service Integration Tests', () => {
	let testUser, systemUser;

	beforeEach(async () => {
		// Очистка данных
		await MarketTransaction.destroy({ where: {} });
		await MarketOffer.destroy({ where: {} });
		await UserState.destroy({ where: {} });
		await User.destroy({ where: {} });

		// Создаем системного пользователя
		systemUser = await User.create({
			id: SYSTEM_USER_ID,
			username: 'SYSTEM',
			role: 'SYSTEM',
			referral: 0,
			blocked: false,
		});

		// Создаем состояние системного пользователя
		await UserState.create({
			userId: SYSTEM_USER_ID,
			stardust: 1000000,
			darkMatter: 1000000,
			stars: 1000000,
			tgStars: 0,
			tonToken: 1000000,
			lockedStardust: 0,
			lockedDarkMatter: 0,
			lockedStars: 0,
		});

		// Создаем тестового пользователя
		testUser = await User.create({
			id: 123456789,
			username: 'testuser',
			role: 'USER',
			referral: 0,
			blocked: false,
		});

		// Создаем состояние тестового пользователя
		await UserState.create({
			userId: testUser.id,
			stardust: 0,
			darkMatter: 0,
			stars: 0,
			tgStars: 0,
			tonToken: 0,
			lockedStardust: 0,
			lockedDarkMatter: 0,
			lockedStars: 0,
		});
	});

	describe('registerFarmingReward', () => {
		test('should register farming reward successfully', async () => {
			// Данные, которые приходят от контроллера
			const offerData = [
				{
					resource: 'stardust',
					amount: 75
				},
				{
					resource: 'darkMatter',
					amount: 25
				}
			];

			// Вызываем метод сервиса
			const result = await GameService.registerFarmingReward(
				testUser.id,
				offerData
			);

			// Проверяем результат
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.message).toBe('Farming rewards transferred to user successfully');
			expect(result.data).toBeDefined();
			expect(result.data.rewards).toHaveLength(2);

			// Проверяем, что создались записи в базе данных
			const offers = await MarketOffer.findAll({
				where: {
					sellerId: SYSTEM_USER_ID,
					buyerId: testUser.id,
					txType: 'FARMING_REWARD'
				}
			});

			expect(offers).toHaveLength(2);

			// Проверяем транзакции
			const transactions = await MarketTransaction.findAll({
				where: {
					offerId: offers.map(o => o.id)
				}
			});

			expect(transactions).toHaveLength(2);

			// Проверяем обновление состояния пользователя
			const updatedUserState = await UserState.findOne({
				where: { userId: testUser.id }
			});

			expect(updatedUserState.stardust).toBe(75);
			expect(updatedUserState.darkMatter).toBe(25);
		});

		test('should validate farming data structure', async () => {
			// Тест с неправильной структурой данных
			const invalidData = { resource: 'stardust', amount: 75 };

			await expect(
				GameService.registerFarmingReward(testUser.id, invalidData)
			).rejects.toThrow('Farming data must be an array with exactly 2 elements');
		});

		test('should validate required fields', async () => {
			// Тест с отсутствующими полями
			const invalidData = [
				{ resource: 'stardust' }, // missing amount
				{ resource: 'darkMatter', amount: 25 }
			];

			await expect(
				GameService.registerFarmingReward(testUser.id, invalidData)
			).rejects.toThrow('Each farming reward must have resource and amount');
		});

		test('should validate resource types', async () => {
			// Тест с неправильным типом ресурса
			const invalidData = [
				{ resource: 'invalid', amount: 75 },
				{ resource: 'darkMatter', amount: 25 }
			];

			await expect(
				GameService.registerFarmingReward(testUser.id, invalidData)
			).rejects.toThrow('Invalid resource: invalid. Must be one of: stardust, darkMatter');
		});

		test('should validate positive amounts', async () => {
			// Тест с отрицательным количеством
			const invalidData = [
				{ resource: 'stardust', amount: -75 },
				{ resource: 'darkMatter', amount: 25 }
			];

			await expect(
				GameService.registerFarmingReward(testUser.id, invalidData)
			).rejects.toThrow('Amount must be positive for resource: stardust');
		});

		test('should prevent duplicate resources', async () => {
			// Тест с дублирующимися ресурсами
			const invalidData = [
				{ resource: 'stardust', amount: 75 },
				{ resource: 'stardust', amount: 25 }
			];

			await expect(
				GameService.registerFarmingReward(testUser.id, invalidData)
			).rejects.toThrow('Duplicate resource: stardust');
		});

		test('should require both stardust and darkMatter', async () => {
			// Тест с отсутствующим одним из обязательных ресурсов
			const invalidData = [
				{ resource: 'stardust', amount: 75 },
				{ resource: 'stars', amount: 25 }
			];

			await expect(
				GameService.registerFarmingReward(testUser.id, invalidData)
			).rejects.toThrow('Farming data must include both stardust and darkMatter');
		});

		test('should handle large amounts correctly', async () => {
			// Тест с большими количествами
			const largeData = [
				{ resource: 'stardust', amount: 1000000 },
				{ resource: 'darkMatter', amount: 500000 }
			];

			const result = await GameService.registerFarmingReward(
				testUser.id,
				largeData
			);

			expect(result.success).toBe(true);

			// Проверяем обновление состояния пользователя
			const updatedUserState = await UserState.findOne({
				where: { userId: testUser.id }
			});

			expect(updatedUserState.stardust).toBe(1000000);
			expect(updatedUserState.darkMatter).toBe(500000);
		});

		test('should handle multiple farming rewards for same user', async () => {
			// Первый вызов
			const firstReward = [
				{ resource: 'stardust', amount: 50 },
				{ resource: 'darkMatter', amount: 25 }
			];

			await GameService.registerFarmingReward(testUser.id, firstReward);

			// Второй вызов
			const secondReward = [
				{ resource: 'stardust', amount: 30 },
				{ resource: 'darkMatter', amount: 15 }
			];

			await GameService.registerFarmingReward(testUser.id, secondReward);

			// Проверяем итоговое состояние
			const finalUserState = await UserState.findOne({
				where: { userId: testUser.id }
			});

			expect(finalUserState.stardust).toBe(80); // 50 + 30
			expect(finalUserState.darkMatter).toBe(40); // 25 + 15
		});
	});
}); 