const MarketService = require('../../service/market-service');
const UserService = require('../../service/user-service');
const { User, MarketOffer, UserState } = require('../../models');

describe('Market Service Integration Tests', () => {
	let user1, user2;

	beforeEach(async () => {
		// Очистка данных
		await MarketOffer.destroy({ where: {} });
		await UserState.destroy({ where: {} });
		await User.destroy({ where: {} });

		// Создаем тестовых пользователей
		user1 = await User.create({
			telegramId: 111,
			username: 'seller',
			firstName: 'Seller',
			lastName: 'User',
		});

		user2 = await User.create({
			telegramId: 222,
			username: 'buyer',
			firstName: 'Buyer',
			lastName: 'User',
		});

		// Создаем состояния пользователей
		await UserState.create({
			userId: user1.id,
			level: 5,
			experience: 1000,
			balance: 500,
			currency: 'TON',
		});

		await UserState.create({
			userId: user2.id,
			level: 3,
			experience: 500,
			balance: 200,
			currency: 'TON',
		});
	});

	describe('createOffer', () => {
		test('should create offer successfully', async () => {
			const offerData = {
				sellerId: user1.id,
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
			};

			const offer = await MarketService.createOffer(offerData);

			expect(offer).toBeDefined();
			expect(offer.sellerId).toBe(user1.id);
			expect(offer.itemType).toBe('artifact');
			expect(offer.price).toBe(100);
			expect(offer.status).toBe('active');

			// Проверяем, что предложение сохранено в БД
			const savedOffer = await MarketOffer.findByPk(offer.id);
			expect(savedOffer).toBeTruthy();
			expect(savedOffer.status).toBe('active');
		});

		test('should not create offer with invalid seller', async () => {
			const offerData = {
				sellerId: 99999, // Несуществующий пользователь
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
			};

			await expect(
				MarketService.createOffer(offerData)
			).rejects.toThrow();
		});
	});

	describe('getOffers', () => {
		test('should get all active offers', async () => {
			// Создаем несколько предложений
			await MarketOffer.create({
				sellerId: user1.id,
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
				status: 'active',
			});

			await MarketOffer.create({
				sellerId: user1.id,
				itemType: 'artifact',
				itemId: 2,
				price: 200,
				currency: 'TON',
				status: 'active',
			});

			await MarketOffer.create({
				sellerId: user2.id,
				itemType: 'artifact',
				itemId: 3,
				price: 150,
				currency: 'TON',
				status: 'sold', // Неактивное предложение
			});

			const offers = await MarketService.getOffers();

			expect(offers).toHaveLength(2);
			expect(offers.every((offer) => offer.status === 'active')).toBe(
				true
			);
		});
	});

	describe('processTransaction', () => {
		test('should process transaction successfully', async () => {
			// Создаем предложение
			const offer = await MarketOffer.create({
				sellerId: user1.id,
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
				status: 'active',
			});

			const transactionData = {
				offerId: offer.id,
				buyerId: user2.id,
			};

			const transaction = await MarketService.processTransaction(
				transactionData
			);

			expect(transaction).toBeDefined();
			expect(transaction.status).toBe('completed');

			// Проверяем изменения в базе данных
			const updatedOffer = await MarketOffer.findByPk(offer.id);
			expect(updatedOffer.status).toBe('sold');

			// Проверяем изменения балансов
			const sellerState = await UserState.findOne({
				where: { userId: user1.id },
			});
			const buyerState = await UserState.findOne({
				where: { userId: user2.id },
			});

			expect(sellerState.balance).toBe(600); // 500 + 100
			expect(buyerState.balance).toBe(100); // 200 - 100
		});

		test('should not process transaction for sold offer', async () => {
			const offer = await MarketOffer.create({
				sellerId: user1.id,
				itemType: 'artifact',
				itemId: 1,
				price: 100,
				currency: 'TON',
				status: 'sold',
			});

			const transactionData = {
				offerId: offer.id,
				buyerId: user2.id,
			};

			await expect(
				MarketService.processTransaction(transactionData)
			).rejects.toThrow();
		});
	});
});
