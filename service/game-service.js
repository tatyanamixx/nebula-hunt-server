/**
 * Game Service for game mechanics operations
 * Created by Claude on 15.07.2025
 * Extracted from market-service.js
 */
const {
	User,
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
	UserState,
	Galaxy,
	Artifact,
	PackageTemplate,
} = require('../models/models');
const {
	UserUpgradeWithTemplate,
	UserTaskWithTemplate,
} = require('../models/template-views');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');
const { SYSTEM_USER_ID, GALAXY_BASE_PRICE } = require('../config/constants');
const logger = require('./logger-service');
const userStateService = require('./user-state-service');
const marketService = require('./market-service');
const taskService = require('./task-service');

class GameService {
	/**
	 * Register the transfer of a resource for an upgrade
	 * @param {Object} params { userId, slug }
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerUpgradePayment({ userId, slug, transaction }) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			// Откладываем проверку всех deferrable ограничений
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});
			
			const { success, userTask } = await taskService.completeTask(userId, slug, t);
			if (!success) {
				throw ApiError.BadRequest('Task not found');
			}


			// Create an offer from the system to transfer the resource
			const offerData = {
				sellerId: userId, // The user "sells" the resource to the system
				itemType: 'resource',
				itemId: `${userTask.reward.type}_${userTask.reward.amount}`,
				price: 0, // Free, because this is an exchange of resources for an upgrade
				currency: 'tonToken', // The currency is not important, because the price is 0
				offerType: 'SYSTEM',
			};

			// Check that the resource is available
			await this.checkResourceAvailability(
				userId,
				{ type: userTask.reward.type, amount: userTask.reward.amount },
				t
			);

			// Lock the resource
			await this.lockResource(userId, { type: userTask.reward.type, amount: userTask.reward.amount }, t);

			// Create an offer
			const offer = await MarketOffer.create(offerData, {
				transaction: t,
			});

			// Create a transaction
			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: SYSTEM_USER_ID, // The system "buys" the resource
					sellerId: userId,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction: t }
			);

			// Create a record about the transaction
			await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: userId,
					toAccount: SYSTEM_USER_ID,
					amount,
					currency: 'tonToken', // The currency is not important, because the price is 0
					txType: 'UPGRADE_RESOURCE',
					status: 'CONFIRMED',
					confirmedAt: new Date(),
				},
				{ transaction: t }
			);

			// Unlock and transfer the resource to the system
			await this.transferResource(offer, SYSTEM_USER_ID, t);

			// Complete the offer
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
				message: 'Resource transferred to the system for an upgrade',
				userTask,
				resource: userTask.reward.type,
				amount: userTask.reward.amount,
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
	 * Register the transfer of a resource for a task
	 * @param {BigInt} userId - User ID
	 * @param {string} slug - Task slug
	 * @param {Object} transaction - Transaction object
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerTaskReward(userId, slug, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			// Откладываем проверку всех deferrable ограничений
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});
			
			const { success, userTask } = await taskService.completeTask(userId, slug, t);
			if (!success) {
				throw ApiError.BadRequest('Task not found');
			}

			// Create an offer from the system to transfer the resource
			const offerData = {
				sellerId: SYSTEM_USER_ID, // The system "sells" the resource to the user
				itemType: 'task',
				itemId: userTask.id,
				price: 0, // Free, because this is a reward for a task
				currency: 'tonToken', // The currency is not important, because the price is 0
				offerType: 'SYSTEM',
				amount: userTask.reward.amount,
				resource: userTask.reward.type,
				txType: 'TASK_REWARD',
			};

			// Create an offer
			const offer = await this.registerReward(offerData, userId, t);

			await t.commit();
			return {
				success: true,
				message:
					'Resource transferred to the user for completing a tas	k',
				userTask,
				resource: userTask.reward.type,
				amount: userTask.reward.amount,
				offer,
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
	 * Register the transfer of a resource for an event
	 * @param {Object} params { userId, eventId, amount, resource }
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerEventReward({ userId, eventId, amount, resource }) {
		const t = await sequelize.transaction();

		try {
			// Create an offer from the system to transfer the resource
			const offerData = {
				sellerId: SYSTEM_USER_ID, // The system "sells" the resource to the user
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Free, because this is a reward for an event
				currency: 'tonToken', // The currency is not important, because the price is 0
				offerType: 'SYSTEM',
			};

			// Create an offer
			const offer = await MarketOffer.create(offerData, {
				transaction: t,
			});

			// Create a transaction
			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: userId, // The user "buys" the resource
					sellerId: SYSTEM_USER_ID,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction: t }
			);

			// Create a record about the transaction
			await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: SYSTEM_USER_ID,
					toAccount: userId,
					amount,
					currency: 'tonToken', // The currency is not important, because the price is 0
					txType: 'EVENT_RESOURCE',
					status: 'CONFIRMED',
					confirmedAt: new Date(),
				},
				{ transaction: t }
			);

			// Transfer the resource to the user
			await this.transferResource(offer, userId, t);

			// Complete the offer
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
				message: 'Resource transferred to the user for an event',
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
	 * Get the farming id for a resource
	 * @param {string} resource - Resource name
	 * @returns {BigInt} Farming id
	 */
	getFarmingId(resource) {
		switch (resource) {
			case 'stardust':
				return 1n;
			case 'darkMatter':
				return 2n;
			case 'stars':
				return 3n;
			default:
				throw ApiError.BadRequest('Invalid resource for farming');
		}
	}

	/**
	 * Register the transfer of a resource for farming
	 * @param {Object} offerData [] { userId, amount, resource, source }
	 * @param {BigInt} buyerId - Buyer ID
	 * @param {Object} transaction - Transaction object
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerFarmingReward(userId, offerData, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		logger.debug('registerFarmingReward');
		try {
			// Откладываем проверку всех deferrable ограничений
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});
			logger.debug('registerFarmingReward', offerData);
			for (const offer of offerData) {
				offer.txType = 'FARMING_REWARD';
				offer.itemType = 'farming';
				offer.itemId = this.getFarmingId(offer.resource);
				offer.price = 0;
				offer.currency = 'tonToken';

				// Create an offer from the system to transfer the resource
				const result = await this.registerReward(offer, userId, t);
			}

			const userState = await userStateService.getUserState(userId, t);

			await t.commit();
			return {
				success: true,
				message: 'Resource transferred to the user for farming',
				userState,
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register farming reward: ${err.message}`
				  );
		}
	}

	/**
	 * Register the transfer of a resource for farming
	 * @param {Object} offerData [] { userId, amount, resource, source }
	 * @param {BigInt} buyerId - Buyer ID
	 * @param {Object} transaction - Transaction object
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerReward(offer, buyerId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		logger.debug('registerReward');
		try {
			// Откладываем проверку всех deferrable ограничений
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});
			logger.debug('registerReward', offer);
			// Create an offer from the system to transfer the resource
			const transactionOffer = await MarketOffer.create(
				{
					sellerId: SYSTEM_USER_ID,
					itemType: offer.itemType,
					itemId: offer.itemId,
					price: offer.price,
					currency: offer.currency,
					amount: offer.amount,
					resource: offer.resource,
					isItemLocked: false,
					offerType: 'SYSTEM',
					expiresAt: null,
					completedAt: new Date(),
					status: 'COMPLETED',
					source: offer.source,
					isItemLocked: false,
				},
				{ transaction: t }
			);

			// Create a transaction
			const transactionMarket = await MarketTransaction.create(
				{
					offerId: transactionOffer.id,
					buyerId: buyerId, // The user "buys" the resource
					sellerId: SYSTEM_USER_ID,
					status: 'COMPLETED',
					completedAt: new Date(),
				},
				{ transaction: t }
			);

			// Create a record about the transaction
			const transferTransaction = await PaymentTransaction.create(
				{
					marketTransactionId: transactionMarket.id,
					fromAccount: SYSTEM_USER_ID,
					toAccount: buyerId,
					priceOrAmount: offer.amount,
					currencyOrResource: offer.resource,
					txType: offer.txType,
					status: 'CONFIRMED',
					confirmedAt: new Date(),
				},
				{ transaction: t }
			);

			// Transfer the resource to the user
			await this.addCurrency(buyerId, offer.resource, offer.amount, t);

			if (offer.price > 0) {
				const paymentTransaction = await PaymentTransaction.create(
					{
						marketTransactionId: transactionMarket.id,
						fromAccount: buyerId,
						toAccount: SYSTEM_USER_ID,
						amount: offer.price,
						currency: offer.currency,
						txType: offer.txType,
						status: 'CONFIRMED',
						confirmedAt: new Date(),
					},
					{ transaction: t }
				);
				await this.deductCurrency(
					buyerId,
					offer.currency,
					offer.price,
					t
				);
			}

			// Commit the transaction if it was created
			if (shouldCommit && !t.finished) {
				await t.commit();
			}
			return {
				success: true,
				message: 'Resource transferred to the user',
				offer,
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register reward: ${err.message}`
				  );
		}
	}

	/**
	 * Register a stars transfer to a galaxy
	 * @param {Object} offer - Offer data
	 * @param {BigInt} buyerId - Buyer ID
	 * @param {string} galaxySeed - Galaxy seed
	 * @param {Object} transaction - Transaction object
	 * @returns {Promise<Object>} - Market offer
	 */
	async registerStarsTransferToGalaxy(userId, offer, galaxySeed, transaction) {	
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		try {
			// Откладываем проверку всех deferrable ограничений
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});
			const galaxy = await Galaxy.findOne({
				where: { seed: galaxySeed, userId: userId },
				transaction: t,
			});
			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found for user');
			}
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: offer.price,
				currency: offer.currency,
				itemId: galaxy.id,
				itemType: 'galaxy',
				amount: offer.amount,
				resource: offer.resource,
				offerType: 'SYSTEM',
				txType: 'GALAXY_RESOURCE',
			};
			const { success, message, offer } = await this.registerReward(
				offerData,
				userId,
				t
			);
			const userState = await userStateService.getUserState(userId, t);
			await galaxy.update(
				{
					starCurrent: galaxy.starCurrent + offer.amount,
				},
				{ transaction: t }
			);
			if (shouldCommit && !t.finished) {
				await t.commit();
			}
			return { success, message, offer, userState, galaxy };
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			throw err instanceof ApiError
				? err
				: ApiError.Internal(
						`Failed to register stars transfer to galaxy: ${err.message}`
				  );
		}
	}

	// Helper methods for resource management
	async checkResourceAvailability(userId, resourceInfo, transaction) {
		const { type, amount } = resourceInfo;

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw ApiError.BadRequest(
				`User state not found for user ${userId}`
			);
		}

		const currentAmount = userState[type] || 0;
		if (currentAmount < amount) {
			throw ApiError.BadRequest(
				`Insufficient ${type}. Required: ${amount}, Available: ${currentAmount}`
			);
		}
	}

	async lockResource(userId, resourceInfo, transaction) {
		const { type, amount } = resourceInfo;

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw ApiError.BadRequest(
				`User state not found for user ${userId}`
			);
		}

		const currentAmount = userState[type] || 0;
		if (currentAmount < amount) {
			throw ApiError.BadRequest(
				`Insufficient ${type}. Required: ${amount}, Available: ${currentAmount}`
			);
		}

		// Deduct the resource
		await userState.update(
			{
				[type]: currentAmount - amount,
			},
			{ transaction }
		);

		logger.debug(`Resource ${type} locked for user ${userId}: ${amount}`);
	}

	async transferResource(offer, buyerId, transaction) {
		const { itemId, sellerId } = offer;

		// Parse itemId to get resource type and amount
		const [resourceType, amountStr] = itemId.split('_');
		const amount = parseInt(amountStr, 10);

		if (isNaN(amount)) {
			throw ApiError.BadRequest(
				`Invalid resource amount in itemId: ${itemId}`
			);
		}

		// Add resource to buyer
		await this.addCurrency(buyerId, resourceType, amount, transaction);

		logger.debug(
			`Resource ${resourceType} transferred from ${sellerId} to ${buyerId}: ${amount}`
		);
	}

	async addCurrency(userId, currency, amount, transaction) {
		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw ApiError.BadRequest(
				`User state not found for user ${userId}`
			);
		}

		const currentAmount = userState[currency] || 0;
		await userState.update(
			{
				[currency]: currentAmount + amount,
			},
			{ transaction }
		);

		logger.debug(`Currency ${currency} added to user ${userId}: ${amount}`);
	}

	async deductCurrency(userId, currency, amount, transaction) {
		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw ApiError.BadRequest(
				`User state not found for user ${userId}`
			);
		}

		const currentAmount = userState[currency] || 0;
		if (currentAmount < amount) {
			throw ApiError.BadRequest(
				`Insufficient ${currency}. Required: ${amount}, Available: ${currentAmount}`
			);
		}

		await userState.update(
			{
				[currency]: currentAmount - amount,
			},
			{ transaction }
		);

		logger.debug(
			`Currency ${currency} deducted from user ${userId}: ${amount}`
		);
	}

	/**
	 * Create a galaxy with an offer
	 * @param {Object} galaxyData - данные галактики
	 * @param {number} buyerId - ID покупателя
	 * @param {Object} offerData - данные оферты (price, currency, expiresAt)
	 */
	async createGalaxyAsGift(galaxyData, buyerId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction; // Коммитим только если транзакция не была передана
		logger.debug('createGalaxyAsGift');

		try {
			//Откладываем проверку внешних ключей до конца транзакции
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});
			// 1. Создаем галактику от имени SYSTEM
			const [galaxy, created] = await Galaxy.findOrCreate({
				where: {
					seed: galaxyData.seed,
				},
				defaults: {
					userId: buyerId,
					starMin: galaxyData.starMin || 100,
					starCurrent: galaxyData.starCurrent || 100,
					price: galaxyData.price || GALAXY_BASE_PRICE,
					seed: galaxyData.seed || '',
					particleCount: galaxyData.particleCount || 100,
					onParticleCountChange:
						galaxyData.onParticleCountChange || true,
					galaxyProperties: galaxyData.galaxyProperties || {},
					active: true,
				},
				transaction: t,
			});
			if (!created && galaxy.userId !== buyerId) {
				throw ApiError.GalaxyAlreadyExists();
				logger.debug(
					'galaxy already exists && buyerId !== galaxy.userId'
				);
			}

			logger.debug('galaxy created', { galaxy });

			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: buyerId,
				price: 0,
				currency: 'tonToken',
				itemId: galaxy.id,
				itemType: 'galaxy',
				amount: galaxy.starCurrent,
				resource: 'stars',
				offerType: 'SYSTEM',
				txType: 'GALAXY_RESOURCE',
			};
			const { offerOut, marketTransaction, payment, transferStars } =
				await marketService.registerOffer(offerData, t);
			const userState = await userStateService.getUserState(buyerId, t);

			// Коммитим транзакцию только если она была создана в этом методе и не завершена
			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			const response = {
				galaxy: galaxy.toJSON(),
				userState,
				offerOut,
				marketTransaction,
				payment,
				transferStars,
			};
			logger.debug('createGalaxyWithOffer response', response);
			return response;
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			if (err instanceof ApiError) {
				throw err;
			}
			logger.error('Error in createSystemGalaxyWithOffer', err);
			throw ApiError.DatabaseError(
				`Failed to create system galaxy with offer: ${err.message}`
			);
		}
	}

	/**
	 * Create a galaxy with an offer
	 * @param {Object} galaxyData - данные галактики
	 * @param {Object} offer - данные оферты (price, currency, expiresAt)
	 */
	async createGalaxyForSale(galaxyData, offer, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction; // Коммитим только если транзакция не была передана
		logger.debug('createGalaxyForSale');

		try {
			//Откладываем проверку внешних ключей до конца транзакции
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction: t,
			});
			// 1. Создаем галактику от имени SYSTEM
			const [galaxy, created] = await Galaxy.findOrCreate({
				where: {
					seed: galaxyData.seed,
				},
				defaults: {
					userId: SYSTEM_USER_ID,
					starMin: galaxyData.starMin || 100,
					starCurrent: galaxyData.starCurrent || 100,
					price: offer.price,
					seed: galaxyData.seed || '',
					particleCount: galaxyData.particleCount || 100,
					onParticleCountChange:
						galaxyData.onParticleCountChange || true,
					galaxyProperties: galaxyData.galaxyProperties || {},
					active: true,
				},
				transaction: t,
			});
			if (!created && galaxy.userId !== SYSTEM_USER_ID) {
				throw ApiError.GalaxyAlreadyExists();
				logger.debug(
					'galaxy already exists && buyerId !== galaxy.userId'
				);
			}

			logger.debug('galaxy created', { galaxy });

			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: buyerId,
				price: offer.price,
				currency: offer.currency,
				itemId: galaxy.id,
				itemType: 'galaxy',
				amount: galaxy.starCurrent,
				resource: 'stars',
				offerType: 'SYSTEM',
				txType: 'GALAXY_RESOURCE',
			};
			// 2. create an offer for sale
			const offerOut = await marketService.createOffer(offer, t);

			// 3. create invoice
			const { transactionMarket, payment } =
				await marketService.createInvoice(offerOut, buyerId, t);

			// Коммитим транзакцию только если она была создана в этом методе и не завершена
			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			const response = {
				galaxy: galaxy.toJSON(),
				offerOut,
				transactionMarket,
				payment,
			};
			logger.debug('createGalaxyForSale response', response);
			return response;
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}
			if (err instanceof ApiError) {
				throw err;
			}
			logger.error('Error in createGalaxyForSale', err);
			throw ApiError.DatabaseError(
				`Failed to create galaxy for sale: ${err.message}`
			);
		}
	}

	async transferStarsToUser(userId, galaxyData, offer) {
		const t = await sequelize.transaction();

		try {
			// Проверяем, что галактика принадлежит пользователю
			const galaxy = await Galaxy.findOne({
				where: { seed: offer.seed },
				transaction: t,
			});
			if (!galaxy) {
				throw ApiError.BadRequest('Galaxy not found');
			}

			// const user = await User.findOne({
			// 	where: { id: userId },
			// 	transaction: t,
			// });

			// Validate stars value
			if (galaxy.starCurrent < 0) {
				throw ApiError.InsufficientStars('Stars cannot be negative');
			}

			const offerData = {
				sellerId: SYSTEM_USER_ID,
				buyerId: userId,
				price: offer.price,
				currency: offer.currency,
				itemId: galaxy.id,
				itemType: 'galaxy',
				amount: offer.amount,
				resource: offer.resource,
				offerType: 'SYSTEM',
				status: 'COMPLETED',
			};
			// Регистрируем передачу звезд через marketService
			const result = await marketService.registerStarsTransfer(offerData);

			galaxy.starCurrent = galaxyData.starCurrent;
			galaxy.particleCount = galaxyData.particleCount;
			galaxy.onParticleCountChange = galaxyData.onParticleCountChange;
			galaxy.galaxyProperties = galaxyData.galaxyProperties || {};
			await galaxy.save({ transaction: t });

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to transfer stars to user: ${err.message}`
			);
		}
	}
}

module.exports = new GameService();
