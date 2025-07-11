/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const {
	User,
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
	MarketCommission,
	PackageStore,
	Galaxy,
	UserState,
	Artifact,
	PackageTemplate,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');
const { commission, pagination, offers } = require('../config/market.config');
const { SYSTEM_USER_ID } = require('../config/constants');
const logger = require('../service/logger-service');
const stateService = require('./state-service');
const packageTemplateService = require('./package-template-service');
const packageStoreService = require('./package-store-service');

class MarketService {
	/**
	 * Создание оферты с блокировкой ресурса или объекта
	 * @param {Object} offerData Данные оферты
	 * @param {Object} options Дополнительные опции
	 * @returns {Promise<Object>} Созданная оферта
	 */
	async createOffer(offerData, options = {}) {
		const transaction = await sequelize.transaction();

		try {
			const { sellerId, itemType, itemId, price, currency, offerType } =
				offerData;

			// Проверяем, что объект или ресурс не заблокирован другой офертой
			// Для системных пакетов (от игры) пропускаем проверку
			if (!(sellerId === SYSTEM_USER_ID && itemType === 'package')) {
				await this.checkItemAvailability(
					sellerId,
					itemType,
					itemId,
					transaction
				);
			}

			// Блокируем ресурс или объект (в зависимости от типа)
			// Для системных пакетов (от игры) пропускаем блокировку
			if (!(sellerId === SYSTEM_USER_ID && itemType === 'package')) {
				await this.lockItem(sellerId, itemType, itemId, transaction);
			}

			// Устанавливаем срок действия оферты в зависимости от типа предмета
			const expirationDays =
				offers.expirationDays[itemType] ||
				offers.expirationDays.default;
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + expirationDays);

			// Определяем флаг блокировки
			// Для системных пакетов (от игры) не блокируем
			const isItemLocked = !(
				sellerId === SYSTEM_USER_ID && itemType === 'package'
			);

			// Создаем оферту
			const offer = await MarketOffer.create(
				{
					sellerId,
					itemType,
					itemId,
					price,
					currency,
					offerType,
					expiresAt,
					isItemLocked,
				},
				{ transaction }
			);

			await transaction.commit();
			return offer;
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	/**
	 * Проверка доступности ресурса или объекта для создания оферты
	 * @param {number} userId ID пользователя
	 * @param {string} itemType Тип предмета
	 * @param {string} itemId ID предмета
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async checkItemAvailability(userId, itemType, itemId, transaction) {
		// Проверяем, есть ли уже активная оферта на этот предмет
		const existingOffer = await MarketOffer.findOne({
			where: {
				sellerId: userId,
				itemType,
				itemId,
				status: 'ACTIVE',
				isItemLocked: true,
			},
			transaction,
		});

		if (existingOffer) {
			throw new ApiError(
				400,
				`Этот ${itemType} уже выставлен на продажу`
			);
		}

		// Проверяем владение предметом в зависимости от типа
		switch (itemType) {
			case 'galaxy':
				await this.checkGalaxyOwnership(userId, itemId, transaction);
				break;
			case 'artifact':
				await this.checkArtifactOwnership(userId, itemId, transaction);
				break;
			case 'resource':
				await this.checkResourceAvailability(
					userId,
					itemId,
					transaction
				);
				break;
			case 'package':
				// Для пакетов отдельная логика проверки
				await this.checkPackageAvailability(
					userId,
					itemId,
					transaction
				);
				break;
			default:
				throw new ApiError(400, 'Неизвестный тип предмета');
		}
	}

	/**
	 * Проверка владения галактикой
	 * @param {number} userId ID пользователя
	 * @param {string} galaxyId ID галактики
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async checkGalaxyOwnership(userId, galaxyId, transaction) {
		const galaxy = await Galaxy.findOne({
			where: {
				id: galaxyId,
				ownerId: userId,
			},
			transaction,
		});

		if (!galaxy) {
			throw new ApiError(
				403,
				'Вы не являетесь владельцем этой галактики'
			);
		}
	}

	/**
	 * Проверка владения артефактом
	 * @param {number} userId ID пользователя
	 * @param {string} artifactId ID артефакта
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async checkArtifactOwnership(userId, artifactId, transaction) {
		const artifact = await Artifact.findOne({
			where: {
				id: artifactId,
				ownerId: userId,
			},
			transaction,
		});

		if (!artifact) {
			throw new ApiError(
				403,
				'Вы не являетесь владельцем этого артефакта'
			);
		}
	}

	/**
	 * Проверка наличия ресурсов
	 * @param {number} userId ID пользователя
	 * @param {string} resourceInfo Информация о ресурсе в формате "тип_количество"
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async checkResourceAvailability(userId, resourceInfo, transaction) {
		const [resourceType, amountStr] = resourceInfo.split('_');
		const amount = parseInt(amountStr, 10);

		if (isNaN(amount) || amount <= 0) {
			throw new ApiError(400, 'Некорректное количество ресурса');
		}

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw new ApiError(404, 'Состояние пользователя не найдено');
		}

		// Проверяем наличие достаточного количества ресурсов
		switch (resourceType) {
			case 'stardust':
				if (userState.stardust < amount) {
					throw new ApiError(400, 'Недостаточно звездной пыли');
				}
				break;
			case 'darkMatter':
				if (userState.darkMatter < amount) {
					throw new ApiError(400, 'Недостаточно темной материи');
				}
				break;
			case 'tgStars':
				if (userState.tgStars < amount) {
					throw new ApiError(400, 'Недостаточно звезд');
				}
				break;
			default:
				throw new ApiError(400, 'Неизвестный тип ресурса');
		}
	}

	/**
	 * Проверка наличия пакета
	 * @param {number} userId ID пользователя
	 * @param {string} packageId ID пакета
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async checkPackageAvailability(userId, packageId, transaction) {
		// Если продавец - системный пользователь (игра), пропускаем проверку
		if (userId === SYSTEM_USER_ID) {
			return;
		}

		const packageStore = await PackageStore.findOne({
			where: {
				id: packageId,
				userId,
				isUsed: false,
			},
			transaction,
		});

		if (!packageStore) {
			throw new ApiError(
				403,
				'У вас нет этого пакета или он уже использован'
			);
		}
	}

	/**
	 * Блокировка ресурса или объекта при создании оферты
	 * @param {number} userId ID пользователя
	 * @param {string} itemType Тип предмета
	 * @param {string} itemId ID предмета
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async lockItem(userId, itemType, itemId, transaction) {
		if (itemType === 'resource') {
			await this.lockResource(userId, itemId, transaction);
		} else if (itemType === 'package') {
			await this.lockPackage(userId, itemId, transaction);
		}
		// Для галактик и артефактов достаточно флага isItemLocked в оферте
	}

	/**
	 * Блокировка ресурса при создании оферты
	 * @param {number} userId ID пользователя
	 * @param {string} resourceInfo Информация о ресурсе в формате "тип_количество"
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async lockResource(userId, resourceInfo, transaction) {
		const [resourceType, amountStr] = resourceInfo.split('_');
		const amount = parseInt(amountStr, 10);

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		// Блокируем ресурсы, уменьшая доступное количество
		switch (resourceType) {
			case 'stardust':
				await userState.update(
					{
						stardust: userState.stardust - amount,
						lockedStardust:
							(userState.lockedStardust || 0) + amount,
					},
					{ transaction }
				);
				break;
			case 'darkMatter':
				await userState.update(
					{
						darkMatter: userState.darkMatter - amount,
						lockedDarkMatter:
							(userState.lockedDarkMatter || 0) + amount,
					},
					{ transaction }
				);
				break;
			case 'tgStars':
				await userState.update(
					{
						tgStars: userState.tgStars - amount,
						lockedTgStars: (userState.lockedTgStars || 0) + amount,
					},
					{ transaction }
				);
				break;
		}
	}

	/**
	 * Блокировка пакета при создании оферты
	 * @param {number} userId ID пользователя
	 * @param {string} packageId ID пакета
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async lockPackage(userId, packageId, transaction) {
		// Если продавец - системный пользователь (игра), не блокируем пакет
		if (userId === SYSTEM_USER_ID) {
			return;
		}

		await PackageStore.update(
			{
				isLocked: true,
			},
			{
				where: {
					id: packageId,
					userId,
					isUsed: false,
				},
				transaction,
			}
		);
	}

	/**
	 * Разблокировка ресурса или объекта при отмене или истечении срока оферты
	 * @param {Object} offer Оферта
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async unlockItem(offer, transaction) {
		const { sellerId, itemType, itemId, isItemLocked } = offer;

		// Если предмет не заблокирован, ничего не делаем
		if (!isItemLocked) {
			return;
		}

		if (itemType === 'resource') {
			await this.unlockResource(sellerId, itemId, transaction);
		} else if (itemType === 'package') {
			await this.unlockPackage(sellerId, itemId, transaction);
		}

		// Обновляем флаг блокировки в оферте
		await offer.update(
			{
				isItemLocked: false,
			},
			{ transaction }
		);
	}

	/**
	 * Разблокировка ресурса при отмене или истечении срока оферты
	 * @param {number} userId ID пользователя
	 * @param {string} resourceInfo Информация о ресурсе в формате "тип_количество"
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async unlockResource(userId, resourceInfo, transaction) {
		const [resourceType, amountStr] = resourceInfo.split('_');
		const amount = parseInt(amountStr, 10);

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			logger.error(
				`Не удалось найти состояние пользователя ${userId} при разблокировке ресурса`
			);
			return;
		}

		// Разблокируем ресурсы, возвращая их в доступное количество
		switch (resourceType) {
			case 'stardust':
				await userState.update(
					{
						stardust: userState.stardust + amount,
						lockedStardust: Math.max(
							0,
							(userState.lockedStardust || 0) - amount
						),
					},
					{ transaction }
				);
				break;
			case 'darkMatter':
				await userState.update(
					{
						darkMatter: userState.darkMatter + amount,
						lockedDarkMatter: Math.max(
							0,
							(userState.lockedDarkMatter || 0) - amount
						),
					},
					{ transaction }
				);
				break;
			case 'tgStars':
				await userState.update(
					{
						tgStars: userState.tgStars + amount,
						lockedTgStars: Math.max(
							0,
							(userState.lockedTgStars || 0) - amount
						),
					},
					{ transaction }
				);
				break;
		}
	}

	/**
	 * Разблокировка пакета при отмене или истечении срока оферты
	 * @param {number} userId ID пользователя
	 * @param {string} packageId ID пакета
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async unlockPackage(userId, packageId, transaction) {
		// Если продавец - системный пользователь (игра), не разблокируем пакет
		if (userId === SYSTEM_USER_ID) {
			return;
		}

		await PackageStore.update(
			{
				isLocked: false,
			},
			{
				where: {
					id: packageId,
					userId,
					isUsed: false,
				},
				transaction,
			}
		);
	}

	/**
	 * Отмена оферты и разблокировка ресурсов или объекта
	 * @param {number} offerId ID оферты
	 * @param {number} userId ID пользователя (для проверки прав)
	 * @returns {Promise<Object>} Обновленная оферта
	 */
	async cancelOffer(offerId, userId) {
		const transaction = await sequelize.transaction();

		try {
			const offer = await MarketOffer.findByPk(offerId, { transaction });

			if (!offer) {
				throw new ApiError(404, 'Оферта не найдена');
			}

			// Проверяем, что пользователь является продавцом или администратором
			if (offer.sellerId !== userId && userId !== SYSTEM_USER_ID) {
				throw new ApiError(403, 'У вас нет прав на отмену этой оферты');
			}

			// Проверяем, что оферта активна
			if (offer.status !== 'ACTIVE') {
				throw new ApiError(
					400,
					'Можно отменить только активные оферты'
				);
			}

			// Разблокируем ресурс или объект
			await this.unlockItem(offer, transaction);

			// Обновляем статус оферты
			await offer.update(
				{
					status: 'CANCELLED',
					isItemLocked: false,
				},
				{ transaction }
			);

			await transaction.commit();
			return offer;
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	/**
	 * Завершение оферты при покупке
	 * @param {number} offerId ID оферты
	 * @param {number} buyerId ID покупателя
	 * @returns {Promise<Object>} Информация о транзакции
	 */
	async completeOffer(offerId, buyerId) {
		const transaction = await sequelize.transaction();

		try {
			const offer = await MarketOffer.findByPk(offerId, { transaction });

			if (!offer) {
				throw new ApiError(404, 'Оферта не найдена');
			}

			// Проверяем, что оферта активна
			if (offer.status !== 'ACTIVE') {
				throw new ApiError(400, 'Можно купить только активные оферты');
			}

			// Проверяем, что покупатель не является продавцом
			if (offer.sellerId === buyerId) {
				throw new ApiError(
					400,
					'Вы не можете купить свою собственную оферту'
				);
			}

			// Создаем рыночную транзакцию
			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId,
					sellerId: offer.sellerId,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction }
			);

			// Обрабатываем платеж
			const paymentTransaction = await this.processPayment(
				offer,
				buyerId,
				marketTransaction.id,
				transaction
			);

			// Передаем право собственности на предмет
			await this.transferItemOwnership(offer, buyerId, transaction);

			// Обновляем статус оферты
			await offer.update(
				{
					status: 'COMPLETED',
					isItemLocked: false,
				},
				{ transaction }
			);

			await transaction.commit();

			return {
				transaction: marketTransaction,
				payment: paymentTransaction,
			};
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	/**
	 * Обработка платежа при покупке
	 * @param {Object} offer Оферта
	 * @param {number} buyerId ID покупателя
	 * @param {number} marketTransactionId ID рыночной транзакции
	 * @param {Transaction} transaction Транзакция Sequelize
	 * @returns {Promise<Object>} Информация о платеже
	 */
	async processPayment(offer, buyerId, marketTransactionId, transaction) {
		const { sellerId, price, currency } = offer;

		// Проверяем наличие средств у покупателя
		const buyerState = await UserState.findOne({
			where: { userId: buyerId },
			transaction,
		});

		if (!buyerState) {
			throw new ApiError(404, 'Состояние покупателя не найдено');
		}

		// Проверяем достаточно ли средств у покупателя
		switch (currency) {
			case 'stardust':
				if (buyerState.stardust < price) {
					throw new ApiError(400, 'Недостаточно звездной пыли');
				}
				break;
			case 'darkMatter':
				if (buyerState.darkMatter < price) {
					throw new ApiError(400, 'Недостаточно темной материи');
				}
				break;
			case 'tgStars':
				if (buyerState.tgStars < price) {
					throw new ApiError(400, 'Недостаточно звезд');
				}
				break;
			case 'tonToken':
				// Для TON токенов проверка происходит на стороне клиента
				break;
			default:
				throw new ApiError(400, 'Неизвестная валюта');
		}

		// Если это не TON, списываем средства у покупателя
		if (currency !== 'tonToken') {
			await this.deductCurrency(buyerId, currency, price, transaction);
		}

		// Рассчитываем комиссию
		const commissionRate = commission[currency] || 0;
		const commissionAmount = price * commissionRate;
		const sellerAmount = price - commissionAmount;

		// Создаем запись о комиссии
		if (commissionAmount > 0) {
			await MarketCommission.create(
				{
					marketTransactionId,
					amount: commissionAmount,
					currency,
					createdAt: new Date(),
				},
				{ transaction }
			);
		}

		// Если это не TON, зачисляем средства продавцу
		if (currency !== 'tonToken') {
			await this.addCurrency(
				sellerId,
				currency,
				sellerAmount,
				transaction
			);
		}

		// Создаем платежную транзакцию
		return await PaymentTransaction.create(
			{
				marketTransactionId,
				fromAccount: buyerId,
				toAccount: sellerId,
				amount: price,
				currency,
				txType: 'MARKET_PURCHASE',
				status: 'CONFIRMED',
				confirmedAt: new Date(),
			},
			{ transaction }
		);
	}

	/**
	 * Списание валюты у пользователя
	 * @param {number} userId ID пользователя
	 * @param {string} currency Тип валюты
	 * @param {number} amount Сумма
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async deductCurrency(userId, currency, amount, transaction) {
		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		switch (currency) {
			case 'stardust':
				await userState.update(
					{
						stardust: userState.stardust - amount,
					},
					{ transaction }
				);
				break;
			case 'darkMatter':
				await userState.update(
					{
						darkMatter: userState.darkMatter - amount,
					},
					{ transaction }
				);
				break;
			case 'tgStars':
				await userState.update(
					{
						tgStars: userState.tgStars - amount,
					},
					{ transaction }
				);
				break;
		}
	}

	/**
	 * Зачисление валюты пользователю
	 * @param {number} userId ID пользователя
	 * @param {string} currency Тип валюты
	 * @param {number} amount Сумма
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async addCurrency(userId, currency, amount, transaction) {
		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			// Если это системный пользователь, ничего не делаем
			if (userId === SYSTEM_USER_ID) {
				return;
			}
			throw new ApiError(404, 'Состояние пользователя не найдено');
		}

		switch (currency) {
			case 'stardust':
				await userState.update(
					{
						stardust: userState.stardust + amount,
					},
					{ transaction }
				);
				break;
			case 'darkMatter':
				await userState.update(
					{
						darkMatter: userState.darkMatter + amount,
					},
					{ transaction }
				);
				break;
			case 'tgStars':
				await userState.update(
					{
						tgStars: userState.tgStars + amount,
					},
					{ transaction }
				);
				break;
		}
	}

	/**
	 * Передача права собственности на предмет
	 * @param {Object} offer Оферта
	 * @param {number} buyerId ID покупателя
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async transferItemOwnership(offer, buyerId, transaction) {
		const { sellerId, itemType, itemId } = offer;

		switch (itemType) {
			case 'galaxy':
				await Galaxy.update(
					{
						ownerId: buyerId,
					},
					{
						where: { id: itemId },
						transaction,
					}
				);
				break;
			case 'artifact':
				await Artifact.update(
					{
						ownerId: buyerId,
					},
					{
						where: { id: itemId },
						transaction,
					}
				);
				break;
			case 'resource':
				await this.transferResource(offer, buyerId, transaction);
				break;
			case 'package':
				// Для системных пакетов (от игры) создаем новую запись для покупателя
				if (sellerId === SYSTEM_USER_ID) {
					const packageData = await PackageStore.findByPk(itemId, {
						transaction,
					});
					if (packageData) {
						// Создаем новую запись пакета для покупателя
						await PackageStore.create(
							{
								id: `${itemId}_${buyerId}_${Date.now()}`, // Генерируем уникальный ID
								userId: buyerId,
								amount: packageData.amount,
								resource: packageData.resource,
								price: packageData.price,
								currency: packageData.currency,
								status: 'ACTIVE',
								isUsed: false,
								isLocked: false,
							},
							{ transaction }
						);
					}
				} else {
					// Для обычных пользовательских пакетов просто передаем владение
					await PackageStore.update(
						{
							userId: buyerId,
							isLocked: false,
						},
						{
							where: { id: itemId },
							transaction,
						}
					);
				}
				break;
		}
	}

	/**
	 * Передача ресурса от продавца покупателю
	 * @param {Object} offer Оферта
	 * @param {number} buyerId ID покупателя
	 * @param {Transaction} transaction Транзакция Sequelize
	 */
	async transferResource(offer, buyerId, transaction) {
		const [resourceType, amountStr] = offer.itemId.split('_');
		const amount = parseInt(amountStr, 10);

		const buyerState = await UserState.findOne({
			where: { userId: buyerId },
			transaction,
		});

		// Зачисляем ресурс покупателю
		switch (resourceType) {
			case 'stardust':
				await buyerState.update(
					{
						stardust: buyerState.stardust + amount,
					},
					{ transaction }
				);
				break;
			case 'darkMatter':
				await buyerState.update(
					{
						darkMatter: buyerState.darkMatter + amount,
					},
					{ transaction }
				);
				break;
			case 'tgStars':
				await buyerState.update(
					{
						tgStars: buyerState.tgStars + amount,
					},
					{ transaction }
				);
				break;
		}

		// Для продавца ресурс уже был списан при создании оферты
		// Нужно только уменьшить количество заблокированных ресурсов
		const sellerState = await UserState.findOne({
			where: { userId: offer.sellerId },
			transaction,
		});

		if (sellerState) {
			switch (resourceType) {
				case 'stardust':
					await sellerState.update(
						{
							lockedStardust: Math.max(
								0,
								(sellerState.lockedStardust || 0) - amount
							),
						},
						{ transaction }
					);
					break;
				case 'darkMatter':
					await sellerState.update(
						{
							lockedDarkMatter: Math.max(
								0,
								(sellerState.lockedDarkMatter || 0) - amount
							),
						},
						{ transaction }
					);
					break;
				case 'tgStars':
					await sellerState.update(
						{
							lockedTgStars: Math.max(
								0,
								(sellerState.lockedTgStars || 0) - amount
							),
						},
						{ transaction }
					);
					break;
			}
		}
	}

	/**
	 * Проверка и обработка истекших оферт
	 * @returns {Promise<number>} Количество обработанных оферт
	 */
	async processExpiredOffers() {
		const transaction = await sequelize.transaction();

		try {
			// Находим все истекшие активные оферты
			const expiredOffers = await MarketOffer.findAll({
				where: {
					status: 'ACTIVE',
					expiresAt: {
						[Op.lt]: new Date(),
					},
				},
				transaction,
			});

			// Обрабатываем каждую истекшую оферту
			for (const offer of expiredOffers) {
				// Разблокируем ресурс или объект
				await this.unlockItem(offer, transaction);

				// Обновляем статус оферты
				await offer.update(
					{
						status: 'EXPIRED',
						isItemLocked: false,
					},
					{ transaction }
				);

				logger.info(
					`Оферта #${offer.id} автоматически закрыта по истечению срока`
				);
			}

			await transaction.commit();
			return expiredOffers.length;
		} catch (error) {
			await transaction.rollback();
			logger.error(
				`Ошибка при обработке истекших оферт: ${error.message}`
			);
			throw error;
		}
	}

	/**
	 * Регистрация передачи ресурса за апгрейд
	 * @param {Object} params { userId, nodeId, amount, resource }
	 * @returns {Promise<Object>} Результат операции
	 */
	async registerUpgradePayment({ userId, nodeId, amount, resource }) {
		const t = await sequelize.transaction();

		try {
			// Создаем оферту от системы для передачи ресурса
			const offerData = {
				sellerId: userId, // Пользователь "продает" ресурс системе
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Бесплатно, т.к. это обмен ресурса на апгрейд
				currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
				offerType: 'SYSTEM',
			};

			// Проверяем наличие ресурса
			await this.checkResourceAvailability(
				userId,
				{ type: resource, amount },
				t
			);

			// Блокируем ресурс
			await this.lockResource(userId, { type: resource, amount }, t);

			// Создаем оферту
			const offer = await MarketOffer.create(offerData, {
				transaction: t,
			});

			// Создаем транзакцию
			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: SYSTEM_USER_ID, // Система "покупает" ресурс
					sellerId: userId,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction: t }
			);

			// Создаем запись о транзакции
			await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: userId,
					toAccount: SYSTEM_USER_ID,
					amount,
					currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
					txType: 'UPGRADE_RESOURCE',
					status: 'CONFIRMED',
					confirmedAt: new Date(),
				},
				{ transaction: t }
			);

			// Разблокируем и передаем ресурс системе
			await this.transferResource(offer, SYSTEM_USER_ID, t);

			// Завершаем оферту
			await offer.update(
				{
					status: 'COMPLETED',
					isItemLocked: false,
				},
				{ transaction: t }
			);

			await t.commit();
			return {
				success: true,
				message: 'Ресурс передан системе за апгрейд',
				nodeId,
				resource,
				amount,
			};
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register upgrade payment: ${err.message}`
				  );
		}
	}

	/**
	 * Регистрация передачи ресурса за выполнение задачи
	 * @param {Object} params { userId, taskId, amount, resource }
	 * @returns {Promise<Object>} Результат операции
	 */
	async registerTaskReward({ userId, taskId, amount, resource }) {
		const t = await sequelize.transaction();

		try {
			// Создаем оферту от системы для передачи ресурса
			const offerData = {
				sellerId: SYSTEM_USER_ID, // Система "продает" ресурс пользователю
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Бесплатно, т.к. это награда за задачу
				currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
				offerType: 'SYSTEM',
			};

			// Создаем оферту
			const offer = await MarketOffer.create(offerData, {
				transaction: t,
			});

			// Создаем транзакцию
			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: userId, // Пользователь "покупает" ресурс
					sellerId: SYSTEM_USER_ID,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction: t }
			);

			// Создаем запись о транзакции
			await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: SYSTEM_USER_ID,
					toAccount: userId,
					amount,
					currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
					txType: 'TASK_RESOURCE',
					status: 'CONFIRMED',
					confirmedAt: new Date(),
				},
				{ transaction: t }
			);

			// Передаем ресурс пользователю
			await this.transferResource(offer, userId, t);

			// Завершаем оферту
			await offer.update(
				{
					status: 'COMPLETED',
					isItemLocked: false,
				},
				{ transaction: t }
			);

			await t.commit();
			return {
				success: true,
				message: 'Ресурс передан пользователю за выполнение задачи',
				taskId,
				resource,
				amount,
			};
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register task reward: ${err.message}`
				  );
		}
	}

	/**
	 * Регистрация передачи ресурса за событие
	 * @param {Object} params { userId, eventId, amount, resource }
	 * @returns {Promise<Object>} Результат операции
	 */
	async registerEventReward({ userId, eventId, amount, resource }) {
		const t = await sequelize.transaction();

		try {
			// Создаем оферту от системы для передачи ресурса
			const offerData = {
				sellerId: SYSTEM_USER_ID, // Система "продает" ресурс пользователю
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Бесплатно, т.к. это награда за событие
				currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
				offerType: 'SYSTEM',
			};

			// Создаем оферту
			const offer = await MarketOffer.create(offerData, {
				transaction: t,
			});

			// Создаем транзакцию
			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: userId, // Пользователь "покупает" ресурс
					sellerId: SYSTEM_USER_ID,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction: t }
			);

			// Создаем запись о транзакции
			await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: SYSTEM_USER_ID,
					toAccount: userId,
					amount,
					currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
					txType: 'EVENT_RESOURCE',
					status: 'CONFIRMED',
					confirmedAt: new Date(),
				},
				{ transaction: t }
			);

			// Передаем ресурс пользователю
			await this.transferResource(offer, userId, t);

			// Завершаем оферту
			await offer.update(
				{
					status: 'COMPLETED',
					isItemLocked: false,
				},
				{ transaction: t }
			);

			await t.commit();
			return {
				success: true,
				message: 'Ресурс передан пользователю за событие',
				eventId,
				resource,
				amount,
			};
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register event reward: ${err.message}`
				  );
		}
	}

	/**
	 * Регистрация передачи ресурса за фарминг
	 * @param {Object} params { userId, amount, resource, source }
	 * @returns {Promise<Object>} Результат операции
	 */
	async registerFarmingReward({ userId, amount, resource, source }) {
		const t = await sequelize.transaction();

		try {
			// Создаем оферту от системы для передачи ресурса
			const offerData = {
				sellerId: SYSTEM_USER_ID, // Система "продает" ресурс пользователю
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Бесплатно, т.к. это награда за фарминг
				currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
				offerType: 'SYSTEM',
			};

			// Создаем оферту
			const offer = await MarketOffer.create(offerData, {
				transaction: t,
			});

			// Создаем транзакцию
			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: userId, // Пользователь "покупает" ресурс
					sellerId: SYSTEM_USER_ID,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction: t }
			);

			// Создаем запись о транзакции
			await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: SYSTEM_USER_ID,
					toAccount: userId,
					amount,
					currency: 'tonToken', // Валюта не имеет значения, т.к. цена 0
					txType: 'FARMING_RESOURCE',
					status: 'CONFIRMED',
					confirmedAt: new Date(),
				},
				{ transaction: t }
			);

			// Передаем ресурс пользователю
			await this.transferResource(offer, userId, t);

			// Завершаем оферту
			await offer.update(
				{
					status: 'COMPLETED',
					isItemLocked: false,
				},
				{ transaction: t }
			);

			await t.commit();
			return {
				success: true,
				message: 'Ресурс передан пользователю за фарминг',
				source,
				resource,
				amount,
			};
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register farming reward: ${err.message}`
				  );
		}
	}

	/**
	 * Создание оферты на продажу ресурса
	 * @param {number} userId ID пользователя
	 * @param {string} resourceType Тип ресурса
	 * @param {number} amount Количество
	 * @param {string} price Цена
	 * @param {string} currency Валюта
	 * @returns {Promise<Object>} Созданная оферта
	 */
	async createResourceOffer(userId, resourceType, amount, price, currency) {
		// Проверяем, что для P2P используется только TON
		if (currency !== 'tonToken') {
			throw ApiError.BadRequest(
				'Для P2P транзакций можно использовать только TON'
			);
		}

		// Формируем itemId в формате "тип_количество"
		const itemId = `${resourceType}_${amount}`;

		// Создаем оферту с блокировкой ресурса
		return await this.createOffer({
			sellerId: userId,
			itemType: 'resource',
			itemId,
			price,
			currency,
			offerType: 'P2P',
		});
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
				const gameField = currencyMap[pkg.resource];
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
						currency: pkg.resource,
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
	 * Получить все активные оферты
	 */
	async getAllOffers() {
		const t = await sequelize.transaction();

		try {
			const offers = await MarketOffer.findAll({
				where: { status: 'ACTIVE' },
				transaction: t,
			});

			await t.commit();
			return offers;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get all offers: ${err.message}`);
		}
	}

	/**
	 * Получить все сделки пользователя (как покупатель или продавец)
	 * @param {number} userId
	 */
	async getUserTransactions(userId) {
		const t = await sequelize.transaction();

		try {
			const transactions = await MarketTransaction.findAll({
				where: {
					[sequelize.Op.or]: [
						{ buyerId: userId },
						{ sellerId: userId },
					],
				},
				order: [['createdAt', 'DESC']],
				transaction: t,
			});

			await t.commit();
			return transactions;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get user transactions: ${err.message}`);
		}
	}

	async getGalaxyOffers() {
		const t = await sequelize.transaction();

		try {
			const offers = await MarketOffer.findAll({
				where: {
					itemType: 'galaxy',
					status: 'ACTIVE',
				},
				transaction: t,
			});

			await t.commit();
			return offers;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get galaxy offers: ${err.message}`);
		}
	}

	/**
	 * Получение системных предложений пакетов и инициализация пакетов пользователя
	 * @param {number} userId - ID пользователя (опционально)
	 * @returns {Promise<Array>} - Список системных предложений пакетов
	 */
	async getPackageOffers(userId = null) {
		const t = await sequelize.transaction();

		try {
			// Получаем системные предложения пакетов
			const offers = await MarketOffer.findAll({
				where: {
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
				transaction: t,
			});

			// Если указан ID пользователя, инициализируем пакеты на основе активных шаблонов
			if (userId) {
				await packageStoreService.initializePackageStore(userId, t);
			}

			await t.commit();
			return offers;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get package offers: ${err.message}`);
		}
	}

	async getArtifactOffers({
		page = 1,
		limit = pagination.defaultLimit,
		status,
		currency,
		rarity,
	}) {
		const t = await sequelize.transaction();

		try {
			// Проверяем и ограничиваем лимит
			limit = Math.min(limit, pagination.maxLimit);

			// Вычисляем смещение для пагинации
			const offset = (page - 1) * limit;

			// Формируем условия запроса
			const where = {
				itemType: 'artifact',
			};

			if (status) {
				where.status = status;
			} else {
				// По умолчанию показываем только активные оферты
				where.status = 'ACTIVE';
			}

			if (currency) {
				where.currency = currency;
			}

			// Получаем оферты с пагинацией
			const offers = await MarketOffer.findAll({
				where,
				limit,
				offset,
				order: [['createdAt', 'DESC']],
				include: [
					{
						model: User,
						as: 'seller',
						attributes: ['id', 'username'],
					},
				],
				transaction: t,
			});

			// Если указан фильтр по редкости, получаем артефакты и фильтруем
			let filteredOffers = offers;
			if (rarity) {
				// Получаем ID артефактов из оферт
				const artifactIds = offers.map((offer) => offer.itemId);

				// Получаем артефакты с указанной редкостью
				const artifacts = await Artifact.findAll({
					where: {
						id: { [Op.in]: artifactIds },
						rarity,
					},
					transaction: t,
				});

				// Фильтруем оферты по найденным артефактам
				const artifactIdSet = new Set(artifacts.map((a) => a.id));
				filteredOffers = offers.filter((offer) =>
					artifactIdSet.has(offer.itemId)
				);
			}

			// Получаем общее количество оферт после фильтрации
			const count = filteredOffers.length;

			// Вычисляем общее количество страниц
			const totalPages = Math.ceil(count / limit);

			const result = {
				offers: filteredOffers,
				pagination: {
					page,
					limit,
					totalItems: count,
					totalPages,
				},
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get artifact offers: ${err.message}`);
		}
	}

	/**
	 * Получение списка P2P оферт с пагинацией
	 * @param {Object} params { page, limit, status, currency, itemType }
	 */
	async getP2POffers({
		page = 1,
		limit = pagination.defaultLimit,
		status,
		currency,
		itemType,
	}) {
		return this.getOffers({
			page,
			limit,
			offerType: 'P2P',
			status,
			currency,
			itemType,
		});
	}

	/**
	 * Получение списка системных оферт с пагинацией
	 * @param {Object} params { page, limit, status, currency, itemType }
	 */
	async getSystemOffers({
		page = 1,
		limit = pagination.defaultLimit,
		status,
		currency,
		itemType,
	}) {
		return this.getOffers({
			page,
			limit,
			offerType: 'SYSTEM',
			status,
			currency,
			itemType,
		});
	}

	async buyOffer(offerId, buyerId, amount = 1) {
		const transaction = await sequelize.transaction();

		try {
			// Получаем оферту
			const offer = await MarketOffer.findByPk(offerId);

			if (!offer) {
				throw ApiError.BadRequest('Оферта не найдена');
			}

			// Проверяем статус оферты
			if (offer.status !== 'ACTIVE') {
				throw ApiError.BadRequest('Оферта недоступна для покупки');
			}

			// Проверяем, что покупатель не является продавцом
			if (offer.sellerId === buyerId) {
				throw ApiError.BadRequest(
					'Нельзя купить свою собственную оферту'
				);
			}

			// Получаем состояние покупателя
			const buyerState = await UserState.findOne({
				where: { userId: buyerId },
			});

			if (!buyerState) {
				throw ApiError.BadRequest('Состояние покупателя не найдено');
			}

			// Проверяем, что у покупателя достаточно валюты
			const totalPrice = Number(offer.price) * amount;

			if (
				offer.currency === 'tgStars' &&
				buyerState.tgStars < totalPrice
			) {
				throw ApiError.BadRequest('Недостаточно TG Stars для покупки');
			} else if (
				offer.currency === 'tonToken' &&
				buyerState.tonToken < totalPrice
			) {
				throw ApiError.BadRequest('Недостаточно TON для покупки');
			}

			// Если это системная оферта с пакетом, обрабатываем особым образом
			if (offer.offerType === 'SYSTEM' && offer.itemType === 'package') {
				// Получаем шаблон пакета
				const template = await PackageTemplate.findByPk(offer.itemId);

				if (!template) {
					throw ApiError.BadRequest('Шаблон пакета не найден');
				}

				// Создаем пакет для пользователя
				const packageId = `${template.id}_${buyerId}_${Date.now()}`;

				await PackageStore.create(
					{
						id: packageId,
						userId: buyerId,
						amount: template.amount,
						resource: template.resource,
						price: template.price,
						currency: template.currency,
						status: 'ACTIVE',
						isUsed: false,
						isLocked: false,
					},
					{ transaction }
				);

				// Списываем валюту у покупателя
				if (offer.currency === 'tgStars') {
					buyerState.tgStars -= totalPrice;
				} else if (offer.currency === 'tonToken') {
					buyerState.tonToken -= totalPrice;
				}

				await buyerState.save({ transaction });

				// Создаем транзакцию
				await MarketTransaction.create(
					{
						offerId,
						buyerId,
						sellerId: offer.sellerId,
						price: offer.price,
						amount,
						currency: offer.currency,
						itemType: offer.itemType,
						itemId: packageId, // Используем ID нового пакета
						status: 'COMPLETED',
					},
					{ transaction }
				);

				await transaction.commit();

				return { success: true, message: 'Пакет успешно куплен' };
			}

			// Обычная оферта - стандартная обработка
			// Списываем валюту у покупателя
			if (offer.currency === 'tgStars') {
				buyerState.tgStars -= totalPrice;
			} else if (offer.currency === 'tonToken') {
				buyerState.tonToken -= totalPrice;
			}

			await buyerState.save({ transaction });

			// Передаем право собственности на предмет
			await this.transferItemOwnership(offer, buyerId, transaction);

			// Создаем транзакцию
			await MarketTransaction.create(
				{
					offerId,
					buyerId,
					sellerId: offer.sellerId,
					price: offer.price,
					amount,
					currency: offer.currency,
					itemType: offer.itemType,
					itemId: offer.itemId,
					status: 'COMPLETED',
				},
				{ transaction }
			);

			// Обновляем статус оферты
			await offer.update(
				{
					status: 'COMPLETED',
					isItemLocked: false,
				},
				{ transaction }
			);

			await transaction.commit();

			return { success: true, message: 'Оферта успешно куплена' };
		} catch (e) {
			await transaction.rollback();
			throw e;
		}
	}

	/**
	 * Get offer by ID
	 * @param {string} offerId - Offer ID
	 * @returns {Promise<Object>} - Market offer
	 */
	async getOfferById(offerId) {
		const t = await sequelize.transaction();

		try {
			const offer = await MarketOffer.findByPk(offerId, {
				include: [
					{
						model: User,
						as: 'seller',
						attributes: ['username', 'id'],
					},
					{
						model: Artifact,
						as: 'artifact',
					},
					{
						model: Galaxy,
						as: 'galaxy',
					},
				],
				transaction: t,
			});

			if (!offer) {
				await t.rollback();
				throw ApiError.NotFound('Offer not found');
			}

			await t.commit();
			return offer;
		} catch (error) {
			await t.rollback();
			if (error instanceof ApiError) {
				throw error;
			}
			throw ApiError.Internal(`Failed to get offer: ${error.message}`);
		}
	}
}

module.exports = new MarketService();
