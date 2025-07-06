/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const {
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
	Artifact,
	User,
	sequelize,
	UserState,
	MarketCommission,
	Galaxy,
	PackageStore,
} = require('../models/models');
// const { commission: commissionConfig } = require('../config/market.config');
const { prometheusMetrics } = require('../middlewares/prometheus-middleware');

// Системный пользователь ID
const { SYSTEM_USER_ID } = require('../config/constants');

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
	 * Создание оферты на продажу любого типа товара
	 * @param {Object} params { sellerId, itemType, itemId, price, currency, expiresAt, offerType }
	 */
	async createOffer({
		sellerId,
		itemType,
		itemId,
		price,
		currency,
		expiresAt,
		offerType = 'P2P',
	}) {
		// Проверка типа товара
		if (!['artifact', 'galaxy', 'package', 'resource'].includes(itemType)) {
			throw new Error('Invalid item type');
		}

		// Проверка в зависимости от типа товара
		switch (itemType) {
			case 'artifact':
				const artifact = await Artifact.findOne({
					where: { id: itemId, userId: sellerId, tradable: true },
				});
				if (!artifact)
					throw new Error('Artifact not found or not tradable');
				break;
			case 'galaxy':
				const galaxy = await Galaxy.findOne({
					where: { id: itemId, userId: sellerId },
				});
				if (!galaxy)
					throw new Error('Galaxy not found or not owned by seller');
				break;
			case 'package':
				const pkg = await PackageStore.findByPk(itemId);
				if (!pkg) throw new Error('Package not found');
				// Для пакетов sellerId должен быть SYSTEM
				if (sellerId !== SYSTEM_USER_ID)
					throw new Error('Only SYSTEM can sell packages');
				break;
			case 'resource':
				// Проверяем, что ресурс существует и принадлежит продавцу
				// Здесь нужно добавить проверку в зависимости от структуры ресурсов
				// Пока оставляем базовую проверку
				if (!itemId) throw new Error('Resource ID is required');
				break;
		}

		// Создание оферты
		const offer = await MarketOffer.create({
			sellerId,
			itemType,
			itemId,
			price,
			currency,
			offerType,
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
			fromAccount: buyerId,
			toAccount: SYSTEM_USER_ID,
			amount: offer.price,
			currency: offer.currency,
			txType: 'BUYER_TO_CONTRACT',
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
					txType: 'BUYER_TO_CONTRACT',
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

			// --- МУЛЬТИВАЛЮТНОЕ ОБНОВЛЕНИЕ БАЛАНСОВ ---
			const currencyMap = {
				stardust: 'stardustCount',
				darkMatter: 'darkMatterCount',
				tgStars: 'tgStarsCount',
				tonToken: 'tokenTonsCount',
			};
			const balanceField = currencyMap[offer.currency];
			if (!balanceField) throw new Error('Unknown currency');

			const price = Number(offer.price);

			// Получаем состояние SYSTEM (контракт) - зачисляются средства на контракт
			const systemState = await UserState.findOne({
				where: { userId: SYSTEM_USER_ID },
				transaction: t,
			});
			if (!systemState) throw new Error('System user state not found');
			if (typeof systemState.state[balanceField] !== 'number')
				systemState.state[balanceField] = 0;

			// Зачисляем средства на контракт
			systemState.state[balanceField] += price;
			await systemState.save({ transaction: t });

			// Получаем состояние покупателя
			const buyerState = await UserState.findOne({
				where: { userId: transaction.buyerId },
				transaction: t,
			});
			if (!buyerState) throw new Error('Buyer state not found');

			if (offer.itemType === 'package') {
				// Логика для пакетов
				const pkg = await PackageStore.findByPk(offer.itemId, {
					transaction: t,
				});
				if (!pkg) throw new Error('Package not found');

				// Начисляем игровую валюту покупателю
				const gameField = currencyMap[pkg.currencyGame];
				if (!gameField) throw new Error('Unknown game currency');
				if (typeof buyerState.state[gameField] !== 'number')
					buyerState.state[gameField] = 0;
				buyerState.state[gameField] += Number(pkg.amount);

				await buyerState.save({ transaction: t });

				// Создаем транзакцию контракт -> покупатель (игровая валюта)
				await PaymentTransaction.create(
					{
						marketTransactionId: transaction.id,
						fromAccount: SYSTEM_USER_ID,
						toAccount: transaction.buyerId,
						amount: pkg.amount,
						currency: pkg.currencyGame,
						txType: 'CONTRACT_TO_BUYER',
						status: 'CONFIRMED',
					},
					{ transaction: t }
				);

				// Завершаем сделку (оферта остается активной для SYSTEM пакетов)
				transaction.status = 'COMPLETED';
				transaction.completedAt = new Date();
				await transaction.save({ transaction: t });

				return { transaction, offer, package: pkg };
			} else {
				// Логика для обычных сделок (артефакты, галактики)
				const commissionRate = await getCommissionRate(offer.currency);
				const commission =
					Math.floor(price * commissionRate * 100) / 100;
				const sellerAmount = price - commission;

				// Переводим артефакт новому владельцу
				if (offer.itemType === 'artifact') {
					const artifact = await Artifact.findByPk(offer.itemId, {
						transaction: t,
					});
					if (!artifact) throw new Error('Artifact not found');
					artifact.userId = transaction.buyerId;
					await artifact.save({ transaction: t });
				}

				// Переводим галактику новому владельцу
				if (offer.itemType === 'galaxy') {
					const galaxy = await Galaxy.findByPk(offer.itemId, {
						transaction: t,
					});
					if (!galaxy) throw new Error('Galaxy not found');
					galaxy.userId = transaction.buyerId;
					await galaxy.save({ transaction: t });
				}

				// Завершаем сделку и оферту
				transaction.status = 'COMPLETED';
				transaction.completedAt = new Date();
				await transaction.save({ transaction: t });
				offer.status = 'COMPLETED';
				await offer.save({ transaction: t });

				// Переводим с контракта продавцу (с учетом комиссии)
				const sellerState = await UserState.findOne({
					where: { userId: transaction.sellerId },
					transaction: t,
				});
				if (!sellerState) throw new Error('Seller state not found');
				if (typeof sellerState.state[balanceField] !== 'number')
					sellerState.state[balanceField] = 0;

				// Списываем с контракта сумму продавцу
				systemState.state[balanceField] -= sellerAmount;
				// Зачисляем продавцу
				sellerState.state[balanceField] += sellerAmount;

				await systemState.save({ transaction: t });
				await sellerState.save({ transaction: t });

				// Комиссия остается на контракте (systemState)

				// Создаем платеж контракт -> продавец
				await PaymentTransaction.create(
					{
						marketTransactionId: transaction.id,
						fromAccount: SYSTEM_USER_ID,
						toAccount: transaction.sellerId,
						amount: sellerAmount,
						currency: offer.currency,
						txType: 'CONTRACT_TO_SELLER',
						status: 'CONFIRMED',
					},
					{ transaction: t }
				);

				// Создаем платеж комиссии
				await PaymentTransaction.create(
					{
						marketTransactionId: transaction.id,
						fromAccount: SYSTEM_USER_ID,
						toAccount: SYSTEM_USER_ID,
						amount: commission,
						currency: offer.currency,
						txType: 'FEE',
						status: 'CONFIRMED',
					},
					{ transaction: t }
				);

				prometheusMetrics.dealCounter.inc();
				prometheusMetrics.purchaseCounter.inc({
					currency: offer.currency,
				});
				prometheusMetrics.revenueCounter.inc(
					{ currency: offer.currency },
					price
				);

				return { transaction, offer, sellerAmount, commission };
			}
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

	async getGalaxyOffers() {
		return await MarketOffer.findAll({
			where: { itemType: 'galaxy', status: 'ACTIVE' },
		});
	}

	async getPackageOffers() {
		return await MarketOffer.findAll({
			where: {
				itemType: 'package',
				status: 'ACTIVE',
				offerType: 'SYSTEM',
			},
		});
	}

	async getArtifactOffers() {
		return await MarketOffer.findAll({
			where: { itemType: 'artifact', status: 'ACTIVE' },
		});
	}

	/**
	 * Отмена оферты (отмена продажи)
	 * @param {Object} params { offerId, sellerId, reason }
	 */
	async cancelOffer({ offerId, sellerId, reason = 'Cancelled by seller' }) {
		return await sequelize.transaction(async (t) => {
			const offer = await MarketOffer.findByPk(offerId, {
				transaction: t,
			});

			if (!offer) {
				throw new Error('Offer not found');
			}

			if (offer.status !== 'ACTIVE') {
				throw new Error('Offer is not active');
			}

			// Проверяем права на закрытие оферты
			if (offer.sellerId !== sellerId && sellerId !== SYSTEM_USER_ID) {
				throw new Error('Only seller or system can close offer');
			}

			// Проверяем, нет ли активных транзакций для этой оферты
			const activeTransactions = await MarketTransaction.findAll({
				where: {
					offerId: offer.id,
					status: 'PENDING',
				},
				transaction: t,
			});

			if (activeTransactions.length > 0) {
				throw new Error('Cannot close offer with pending transactions');
			}

			// Отменяем оферту
			offer.status = 'CANCELLED';
			offer.cancelledAt = new Date();
			offer.cancelReason = reason;
			await offer.save({ transaction: t });

			return { offer, cancelledTransactions: activeTransactions };
		});
	}

	/**
	 * Отмена сделки: возврат средств покупателю, отмена платежа
	 * @param {Object} params { transactionId, reason }
	 */
	async cancelDeal({ transactionId, reason = 'Cancelled by user' }) {
		return await sequelize.transaction(async (t) => {
			const transaction = await MarketTransaction.findByPk(
				transactionId,
				{
					transaction: t,
				}
			);
			if (!transaction || transaction.status !== 'PENDING') {
				throw new Error('Transaction not found or not pending');
			}

			const offer = await MarketOffer.findByPk(transaction.offerId, {
				transaction: t,
			});
			if (!offer || offer.status !== 'ACTIVE') {
				throw new Error('Offer not found or not active');
			}

			// Находим платеж
			const payment = await PaymentTransaction.findOne({
				where: {
					marketTransactionId: transaction.id,
					txType: 'BUYER_TO_CONTRACT',
				},
				transaction: t,
			});
			if (!payment) throw new Error('Payment not found');

			// Возвращаем средства покупателю
			const currencyMap = {
				stardust: 'stardustCount',
				darkMatter: 'darkMatterCount',
				tgStars: 'tgStarsCount',
				tonToken: 'tokenTonsCount',
			};
			const balanceField = currencyMap[offer.currency];
			if (!balanceField) throw new Error('Unknown currency');

			const price = Number(offer.price);

			// При отмене сделки просто меняем статус платежа на FAILED
			// Средства не были зачислены на контракт, поэтому их не нужно возвращать

			// Отменяем платеж
			payment.status = 'FAILED';
			await payment.save({ transaction: t });

			// Отменяем сделку
			transaction.status = 'CANCELLED';
			await transaction.save({ transaction: t });

			// Запись о возврате средств не создается, так как средства не были зачислены на контракт

			return { transaction, payment, reason };
		});
	}

	/**
	 * Удаление всех объектов SYSTEM при отмене транзакции
	 * @param {Object} params { transactionId, reason }
	 */
	async cancelSystemDeal({ transactionId, reason = 'Cancelled by user' }) {
		return await sequelize.transaction(async (t) => {
			const transaction = await MarketTransaction.findByPk(
				transactionId,
				{
					transaction: t,
				}
			);
			if (!transaction || transaction.status !== 'PENDING')
				throw new Error('Transaction not found or not pending');

			// Отменяем сделку
			transaction.status = 'CANCELLED';
			await transaction.save({ transaction: t });

			// Отменяем платеж
			const payment = await PaymentTransaction.findOne({
				where: {
					marketTransactionId: transaction.id,
					txType: 'BUYER_TO_CONTRACT',
				},
				transaction: t,
			});
			if (payment && payment.status === 'PENDING') {
				payment.status = 'FAILED';
				await payment.save({ transaction: t });
			}

			return { transaction, reason };
		});
	}

	/**
	 * Инициализация пакетов в системе
	 * Создает пакеты в PackageStore и оферты для них из переданных данных
	 */
	async initializePackages(packagesData) {
		const t = await sequelize.transaction();

		try {
			if (!Array.isArray(packagesData) || packagesData.length === 0) {
				throw new Error('Packages data must be a non-empty array');
			}

			const createdPackages = [];
			const createdOffers = [];

			for (const pkgData of packagesData) {
				// Валидация данных пакета
				if (
					!pkgData.id ||
					!pkgData.amount ||
					!pkgData.currencyGame ||
					!pkgData.price ||
					!pkgData.currency
				) {
					throw new Error(
						'Invalid package data: missing required fields'
					);
				}

				// Проверяем, существует ли уже пакет
				const existingPackage = await PackageStore.findByPk(
					pkgData.id,
					{
						transaction: t,
					}
				);

				let packageRecord;
				if (!existingPackage) {
					// Создаем пакет
					packageRecord = await PackageStore.create(
						{
							...pkgData,
							status: pkgData.status || 'ACTIVE',
						},
						{
							transaction: t,
						}
					);
					createdPackages.push(packageRecord);
				} else {
					packageRecord = existingPackage;
				}

				// Проверяем, существует ли уже оферта для этого пакета
				const existingOffer = await MarketOffer.findOne({
					where: {
						itemType: 'package',
						itemId: packageRecord.id,
						offerType: 'SYSTEM',
						status: 'ACTIVE',
					},
					transaction: t,
				});

				if (!existingOffer) {
					// Создаем оферту для пакета
					const offer = await MarketOffer.create(
						{
							sellerId: SYSTEM_USER_ID,
							itemType: 'package',
							itemId: packageRecord.id,
							price: packageRecord.price,
							currency: packageRecord.currency,
							offerType: 'SYSTEM',
							status: 'ACTIVE',
						},
						{ transaction: t }
					);

					createdOffers.push({
						packageId: packageRecord.id,
						offerId: offer.id,
						price: packageRecord.price,
						currency: packageRecord.currency,
						amount: packageRecord.amount,
						currencyGame: packageRecord.currencyGame,
					});
				}
			}

			await t.commit();
			return {
				message: `Successfully initialized ${createdPackages.length} packages and ${createdOffers.length} offers`,
				createdPackages,
				createdOffers,
				totalPackages: packagesData.length,
			};
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to initialize packages: ${err.message}`);
		}
	}
}

module.exports = new MarketService();
