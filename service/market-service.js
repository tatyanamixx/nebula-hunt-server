const {
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
	Artifact,
	User,
	sequelize,
	UserState,
	MarketCommission,
} = require('../models/models');
const { commission: commissionConfig } = require('../config/market.config');
const { prometheusMetrics } = require('../middlewares/prometheus-middleware');

// Кэш для комиссий (в памяти)
const commissionCache = {};

async function getCommissionRate(currency) {
	if (commissionCache[currency] !== undefined)
		return commissionCache[currency];
	const rec = await MarketCommission.findOne({ where: { currency } });
	if (rec) {
		commissionCache[currency] = rec.rate;
		return rec.rate;
	}
	commissionCache[currency] = 0.05;
	return 0.05; // по умолчанию 5%
}

class MarketService {
	/**
	 * Создание оферты на продажу артефакта
	 * @param {Object} params { sellerId, artifactId, price, currency, expiresAt }
	 */
	async createOffer({ sellerId, artifactId, price, currency, expiresAt }) {
		// Проверка, что артефакт принадлежит продавцу и доступен для продажи
		const artifact = await Artifact.findOne({
			where: { id: artifactId, userId: sellerId, tradable: true },
		});
		if (!artifact) throw new Error('Artifact not found or not tradable');

		// Создание оферты
		const offer = await MarketOffer.create({
			sellerId,
			itemType: 'artifact',
			itemId: artifactId,
			price,
			currency,
			expiresAt,
		});
		prometheusMetrics.offerCounter.inc();
		return offer;
	}

	/**
	 * Выставление инвойса (создание сделки и платежа)
	 * @param {Object} params { offerId, buyerId }
	 */
	async createInvoice({ offerId, buyerId }) {
		// Получаем оферту
		const offer = await MarketOffer.findByPk(offerId);
		if (!offer || offer.status !== 'ACTIVE')
			throw new Error('Offer not found or not active');

		// Создаем сделку
		const transaction = await MarketTransaction.create({
			offerId: offer.id,
			buyerId,
			sellerId: offer.sellerId,
			status: 'PENDING',
		});

		// Создаем платеж: покупатель -> контракт/система
		const payment = await PaymentTransaction.create({
			marketTransactionId: transaction.id,
			fromAccount: String(buyerId),
			toAccount: 'system_wallet',
			amount: offer.price,
			currency: offer.currency,
			txType: 'USER_TO_CONTRACT',
			status: 'PENDING',
		});

		return { transaction, payment };
	}

	/**
	 * Проведение сделки: проверка оплаты, смена владельца артефакта, завершение сделки, обновление балансов
	 * @param {Object} params { transactionId, blockchainTxId }
	 */
	async processDeal({ transactionId, blockchainTxId }) {
		// Транзакция БД для атомарности
		return await sequelize.transaction(async (t) => {
			const transaction = await MarketTransaction.findByPk(
				transactionId,
				{
					transaction: t,
				}
			);
			if (!transaction || transaction.status !== 'PENDING')
				throw new Error('Transaction not found or not pending');

			const offer = await MarketOffer.findByPk(transaction.offerId, {
				transaction: t,
			});
			if (!offer || offer.status !== 'ACTIVE')
				throw new Error('Offer not found or not active');

			// Находим платеж и подтверждаем его
			const payment = await PaymentTransaction.findOne({
				where: {
					marketTransactionId: transaction.id,
					txType: 'USER_TO_CONTRACT',
				},
				transaction: t,
			});
			if (!payment) throw new Error('Payment not found');
			if (payment.status !== 'PENDING')
				throw new Error('Payment already processed');

			// Подтверждаем платеж
			payment.status = 'CONFIRMED';
			payment.blockchainTxId = blockchainTxId;
			payment.confirmedAt = new Date();
			await payment.save({ transaction: t });

			// --- МУЛЬТИВАЛЮТНОЕ ОБНОВЛЕНИЕ БАЛАНСОВ С КОМИССИЕЙ ---
			const commissionRate = await getCommissionRate(offer.currency);
			const currencyMap = {
				stardust: 'stardustCount',
				darkMatter: 'darkMatterCount',
				tgStars: 'tgStarsCount',
				tonToken: 'tokenTonsCount',
			};
			const balanceField = currencyMap[offer.currency];
			if (!balanceField) throw new Error('Unknown currency');

			const price = Number(offer.price);
			const commission = Math.floor(price * commissionRate * 100) / 100; // округление до 2 знаков
			const sellerAmount = price - commission;

			// 1. Списываем у покупателя
			const buyerState = await UserState.findOne({
				where: { userId: transaction.buyerId },
				transaction: t,
			});
			if (!buyerState) throw new Error('Buyer state not found');
			if (typeof buyerState.state[balanceField] !== 'number')
				buyerState.state[balanceField] = 0;
			if (buyerState.state[balanceField] < price)
				throw new Error('Insufficient buyer balance');
			buyerState.state[balanceField] -= price;
			await buyerState.save({ transaction: t });

			// 2. Зачисляем на контракт (SYSTEM userId = -1)
			const systemState = await UserState.findOne({
				where: { userId: -1 },
				transaction: t,
			});
			if (!systemState) throw new Error('System user state not found');
			if (typeof systemState.state[balanceField] !== 'number')
				systemState.state[balanceField] = 0;
			systemState.state[balanceField] += price;
			await systemState.save({ transaction: t });

			// Переводим артефакт новому владельцу
			if (offer.itemType === 'artifact') {
				const artifact = await Artifact.findByPk(offer.itemId, {
					transaction: t,
				});
				if (!artifact) throw new Error('Artifact not found');
				artifact.userId = transaction.buyerId;
				await artifact.save({ transaction: t });
			}

			// Завершаем сделку и оферту
			transaction.status = 'COMPLETED';
			transaction.completedAt = new Date();
			await transaction.save({ transaction: t });
			offer.status = 'COMPLETED';
			await offer.save({ transaction: t });

			// 3. Переводим с контракта продавцу (с учетом комиссии)
			const sellerState = await UserState.findOne({
				where: { userId: transaction.sellerId },
				transaction: t,
			});
			if (!sellerState) throw new Error('Seller state not found');
			if (typeof sellerState.state[balanceField] !== 'number')
				sellerState.state[balanceField] = 0;
			systemState.state[balanceField] -= sellerAmount; // списываем с контракта только сумму продавцу
			sellerState.state[balanceField] += sellerAmount; // зачисляем продавцу
			await systemState.save({ transaction: t });
			await sellerState.save({ transaction: t });

			// 4. Комиссия остается на контракте (systemState)

			// (Опционально) создаем платеж контракт -> продавец
			await PaymentTransaction.create(
				{
					marketTransactionId: transaction.id,
					fromAccount: 'system_wallet',
					toAccount: String(transaction.sellerId),
					amount: sellerAmount,
					currency: offer.currency,
					txType: 'CONTRACT_TO_SELLER',
					status: 'CONFIRMED',
				},
				{ transaction: t }
			);

			// (Опционально) создаем платеж комиссии
			await PaymentTransaction.create(
				{
					marketTransactionId: transaction.id,
					fromAccount: 'system_wallet',
					toAccount: 'system_fee',
					amount: commission,
					currency: offer.currency,
					txType: 'FEE',
					status: 'CONFIRMED',
				},
				{ transaction: t }
			);

			prometheusMetrics.dealCounter.inc();
			prometheusMetrics.purchaseCounter.inc({ currency: offer.currency });
			prometheusMetrics.revenueCounter.inc(
				{ currency: offer.currency },
				price
			);

			return { transaction, offer, sellerAmount, commission };
		});
	}

	/**
	 * Получить все оферты (можно добавить фильтры)
	 */
	async getAllOffers() {
		return await MarketOffer.findAll({ where: { status: 'ACTIVE' } });
	}

	/**
	 * Получить все сделки пользователя (как покупатель или продавец)
	 * @param {number} userId
	 */
	async getUserTransactions(userId) {
		return await MarketTransaction.findAll({
			where: {
				[sequelize.Op.or]: [{ buyerId: userId }, { sellerId: userId }],
			},
			order: [['createdAt', 'DESC']],
		});
	}
}

module.exports = new MarketService();
