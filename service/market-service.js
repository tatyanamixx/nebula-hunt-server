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
	 * Create an offer with resource or object locking
	 * @param {Object} offerData Offer data
	 * @param {Object} options Additional options
	 * @returns {Promise<Object>} Created offer
	 */
	async createOffer(offerData, options = {}) {
		const transaction = await sequelize.transaction();

		try {
			const { sellerId, itemType, itemId, price, currency, offerType } =
				offerData;

			// Check that the object or resource is not locked by another offer
			// For system packages (from the game) skip the check
			if (!(sellerId === SYSTEM_USER_ID && itemType === 'package')) {
				await this.checkItemAvailability(
					sellerId,
					itemType,
					itemId,
					transaction
				);
			}

			// Lock the resource or object (depending on the type)
			// For system packages (from the game) skip the lock
			if (!(sellerId === SYSTEM_USER_ID && itemType === 'package')) {
				await this.lockItem(sellerId, itemType, itemId, transaction);
			}

			// Set the expiration date of the offer depending on the item type
			// For system packages (from the game) do not set the expiration date
			let expiresAt = null;
			let isItemLocked = true;

			if (sellerId === SYSTEM_USER_ID && itemType === 'package') {
				// System packages from the game do not have an expiration date and are not locked
				isItemLocked = false;
			} else {
				// For other offers set the expiration date
				const expirationDays =
					offers.expirationDays[itemType] ||
					offers.expirationDays.default;
				expiresAt = new Date();
				expiresAt.setDate(expiresAt.getDate() + expirationDays);
			}

			// Create an offer
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
	 * Check the availability of a resource or object for creating an offer
	 * @param {number} userId User ID
	 * @param {string} itemType Item type
	 * @param {string} itemId Item ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async checkItemAvailability(userId, itemType, itemId, transaction) {
		// Check if there is an active offer for this item
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
			throw new ApiError(400, `This ${itemType} is already on sale`);
		}

		// Check the ownership of the item depending on the type
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
				// For packages, a separate check logic
				await this.checkPackageAvailability(
					userId,
					itemId,
					transaction
				);
				break;
			default:
				throw new ApiError(400, 'Unknown item type');
		}
	}

	/**
	 * Check the ownership of a galaxy
	 * @param {number} userId User ID
	 * @param {string} galaxyId Galaxy ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async checkGalaxyOwnership(userId, galaxyId, transaction) {
		const galaxy = await Galaxy.findOne({
			where: {
				id: galaxyId,
				userId: userId,
			},
			transaction,
		});

		if (!galaxy) {
			throw new ApiError(403, 'You are not the owner of this galaxy');
		}
	}

	/**
	 * Check the ownership of an artifact
	 * @param {number} userId User ID
	 * @param {string} artifactId Artifact ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async checkArtifactOwnership(userId, artifactId, transaction) {
		const artifact = await Artifact.findOne({
			where: {
				id: artifactId,
				userId: userId,
			},
			transaction,
		});

		if (!artifact) {
			throw new ApiError(403, 'You are not the owner of this artifact');
		}
	}

	/**
	 * Check the availability of resources
	 * @param {number} userId User ID
	 * @param {string} resourceInfo Resource information in the format "type_amount"
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async checkResourceAvailability(userId, resourceInfo, transaction) {
		const [resourceType, amountStr] = resourceInfo.split('_');
		const amount = parseInt(amountStr, 10);

		if (isNaN(amount) || amount <= 0) {
			throw new ApiError(400, 'Invalid resource amount');
		}

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			throw new ApiError(404, 'User state not found');
		}

		// Проверяем наличие достаточного количества ресурсов
		switch (resourceType) {
			case 'stardust':
				if (userState.stardust < amount) {
					throw new ApiError(400, 'Not enough stardust');
				}
				break;
			case 'darkMatter':
				if (userState.darkMatter < amount) {
					throw new ApiError(400, 'Not enough dark matter');
				}
				break;
			case 'tgStars':
				if (userState.tgStars < amount) {
					throw new ApiError(400, 'Not enough tg stars');
				}
				break;
			default:
				throw new ApiError(400, 'Unknown resource type');
		}
	}

	/**
	 * Check the availability of a package
	 * @param {number} userId User ID
	 * @param {string} packageId Package ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async checkPackageAvailability(userId, packageId, transaction) {
		// If the seller is the system user (game), skip the check
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
				'You do not have this package or it has already been used'
			);
		}
	}

	/**
	 * Lock a resource or object when creating an offer
	 * @param {number} userId User ID
	 * @param {string} itemType Item type
	 * @param {string} itemId Item ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async lockItem(userId, itemType, itemId, transaction) {
		if (itemType === 'resource') {
			await this.lockResource(userId, itemId, transaction);
		} else if (itemType === 'package') {
			await this.lockPackage(userId, itemId, transaction);
		}
		// For galaxies and artifacts, only the isItemLocked flag in the offer is enough
	}

	/**
	 * Lock a resource when creating an offer
	 * @param {number} userId User ID
	 * @param {string} resourceInfo Resource information in the format "type_amount"
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async lockResource(userId, resourceInfo, transaction) {
		const [resourceType, amountStr] = resourceInfo.split('_');
		const amount = parseInt(amountStr, 10);

		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		// Lock resources, reducing the available amount
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
	 * Lock a package when creating an offer
	 * @param {number} userId User ID
	 * @param {string} packageId Package ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async lockPackage(userId, packageId, transaction) {
		// If the seller is the system user (game), do not lock the package
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
	 * Unlock a resource or object when cancelling or expiring an offer
	 * @param {Object} offer Offer
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async unlockItem(offer, transaction) {
		const { sellerId, itemType, itemId, isItemLocked } = offer;

		// If the item is not locked, do nothing
		if (!isItemLocked) {
			return;
		}

		if (itemType === 'resource') {
			await this.unlockResource(sellerId, itemId, transaction);
		} else if (itemType === 'package') {
			await this.unlockPackage(sellerId, itemId, transaction);
		}

		// Update the isItemLocked flag in the offer
		await offer.update(
			{
				isItemLocked: false,
			},
			{ transaction }
		);
	}

	/**
	 * Unlock a resource when cancelling or expiring an offer
	 * @param {number} userId User ID
	 * @param {string} resourceInfo Resource information in the format "type_amount"
	 * @param {Transaction} transaction Sequelize transaction
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
				`Failed to find the user state ${userId} when unlocking the resource`
			);
			return;
		}

		// Unlock resources, returning them to the available amount
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
	 * Unlock a package when cancelling or expiring an offer
	 * @param {number} userId User ID
	 * @param {string} packageId Package ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async unlockPackage(userId, packageId, transaction) {
		// If the seller is the system user (game), do not unlock the package
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
	 * Cancel an offer and unlock a resource or object
	 * @param {number} offerId Offer ID
	 * @param {number} userId User ID (for checking permissions)
	 * @returns {Promise<Object>} Updated offer
	 */
	async cancelOffer(offerId, userId) {
		const transaction = await sequelize.transaction();

		try {
			const offer = await MarketOffer.findByPk(offerId, { transaction });

			if (!offer) {
				throw new ApiError(404, 'Offer not found');
			}

			// Check that the user is the seller or an administrator
			if (offer.sellerId !== userId && userId !== SYSTEM_USER_ID) {
				throw new ApiError(
					403,
					'You do not have permission to cancel this offer'
				);
			}

			// Check that the offer is active
			if (offer.status !== 'ACTIVE') {
				throw new ApiError(400, 'Only active offers can be cancelled');
			}

			// Unlock the resource or object
			await this.unlockItem(offer, transaction);

			// Update the status of the offer
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
	 * Complete an offer when buying
	 * @param {number} offerId Offer ID
	 * @param {number} buyerId Buyer ID
	 * @returns {Promise<Object>} Information about the transaction
	 */
	async completeOffer(offerId, buyerId) {
		const transaction = await sequelize.transaction();

		try {
			const offer = await MarketOffer.findByPk(offerId, { transaction });

			if (!offer) {
				throw new ApiError(404, 'Offer not found');
			}

			// Check that the offer is active
			if (offer.status !== 'ACTIVE') {
				throw new ApiError(400, 'Only active offers can be purchased');
			}

			// Check that the buyer is not the seller
			if (offer.sellerId === buyerId) {
				throw new ApiError(400, 'You cannot buy your own offer');
			}

			// Create a market transaction
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

			// Process the payment
			const paymentTransaction = await this.processPayment(
				offer,
				buyerId,
				marketTransaction.id,
				transaction
			);

			// Transfer ownership of the item
			await this.transferItemOwnership(offer, buyerId, transaction);

			// Update the status of the offer
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
	 * Process the payment when buying
	 * @param {Object} offer Offer
	 * @param {number} buyerId Buyer ID
	 * @param {number} marketTransactionId Market transaction ID
	 * @param {Transaction} transaction Транзакция Sequelize
	 * @returns {Promise<Object>} Information about the payment
	 */
	async processPayment(offer, buyerId, marketTransactionId, transaction) {
		const { sellerId, price, currency } = offer;

		// Check that the buyer has enough funds
		const buyerState = await UserState.findOne({
			where: { userId: buyerId },
			transaction,
		});

		if (!buyerState) {
			throw new ApiError(404, 'Buyer state not found');
		}

		// Check that the buyer has enough funds
		switch (currency) {
			case 'stardust':
				if (buyerState.stardust < price) {
					throw new ApiError(400, 'Insufficient stardust');
				}
				break;
			case 'darkMatter':
				if (buyerState.darkMatter < price) {
					throw new ApiError(400, 'Insufficient dark matter');
				}
				break;
			case 'tgStars':
				if (buyerState.tgStars < price) {
					throw new ApiError(400, 'Insufficient stars');
				}
				break;
			case 'tonToken':
				// For TON tokens, the check is done on the client side
				break;
			default:
				throw new ApiError(400, 'Unknown currency');
		}

		// If this is not TON, deduct the funds from the buyer
		if (currency !== 'tonToken') {
			await this.deductCurrency(buyerId, currency, price, transaction);
		}

		// Calculate the commission
		const commissionRate = commission[currency] || 0;
		const commissionAmount = price * commissionRate;
		const sellerAmount = price - commissionAmount;

		// Create a record about the commission
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

		// If this is not TON, add the funds to the seller
		if (currency !== 'tonToken') {
			await this.addCurrency(
				sellerId,
				currency,
				sellerAmount,
				transaction
			);
		}

		// Create a payment transaction
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
	 * Deduct currency from the user
	 * @param {number} userId User ID
	 * @param {string} currency Currency type
	 * @param {number} amount Amount
	 * @param {Transaction} transaction Sequelize transaction
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
	 * Add currency to the user
	 * @param {number} userId User ID
	 * @param {string} currency Currency type
	 * @param {number} amount Amount
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async addCurrency(userId, currency, amount, transaction) {
		const userState = await UserState.findOne({
			where: { userId },
			transaction,
		});

		if (!userState) {
			// If this is the system user, do nothing
			if (userId === SYSTEM_USER_ID) {
				return;
			}
			throw new ApiError(404, 'User state not found');
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
	 * Transfer ownership of an item
	 * @param {Object} offer Offer
	 * @param {number} buyerId Buyer ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async transferItemOwnership(offer, buyerId, transaction) {
		const { sellerId, itemType, itemId } = offer;

		switch (itemType) {
			case 'galaxy':
				await Galaxy.update(
					{
						userId: buyerId,
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
						userId: buyerId,
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
				// For system packages (from the game), create a new record for the buyer
				if (sellerId === SYSTEM_USER_ID) {
					const packageData = await PackageStore.findByPk(itemId, {
						transaction,
					});
					if (packageData) {
						// Create a new record for the buyer
						await PackageStore.create(
							{
								id: `${itemId}_${buyerId}_${Date.now()}`, // Generate a unique ID
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
					// For ordinary user packages, simply transfer ownership
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
	 * Transfer a resource from the seller to the buyer
	 * @param {Object} offer Offer
	 * @param {number} buyerId Buyer ID
	 * @param {Transaction} transaction Sequelize transaction
	 */
	async transferResource(offer, buyerId, transaction) {
		const [resourceType, amountStr] = offer.itemId.split('_');
		const amount = parseInt(amountStr, 10);

		const buyerState = await UserState.findOne({
			where: { userId: buyerId },
			transaction,
		});

		// Add the resource to the buyer
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

		// For the seller, the resource was already deducted when the offer was created
		// We only need to reduce the number of locked resources
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
	 * Check and process expired offers
	 * @returns {Promise<number>} Number of processed offers
	 */
	async processExpiredOffers() {
		const transaction = await sequelize.transaction();

		try {
			// Find all expired active offers
			// Exclude system packages from the game (they do not have an expiration date)
			const expiredOffers = await MarketOffer.findAll({
				where: {
					status: 'ACTIVE',
					expiresAt: {
						[Op.lt]: new Date(),
					},
					// Exclude system packages from the game
					[Op.not]: {
						sellerId: SYSTEM_USER_ID,
						itemType: 'package',
					},
				},
				transaction,
			});

			// Process each expired offer
			for (const offer of expiredOffers) {
				// Unlock the resource or object
				await this.unlockItem(offer, transaction);

				// Update the status of the offer
				await offer.update(
					{
						status: 'EXPIRED',
						isItemLocked: false,
					},
					{ transaction }
				);

				logger.info(
					`Offer #${offer.id} automatically closed due to expiration`
				);
			}

			await transaction.commit();
			return expiredOffers.length;
		} catch (error) {
			await transaction.rollback();
			logger.error(`Error processing expired offers: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Register the transfer of a resource for an upgrade
	 * @param {Object} params { userId, nodeId, amount, resource }
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerUpgradePayment({ userId, nodeId, amount, resource }) {
		const t = await sequelize.transaction();

		try {
			// Create an offer from the system to transfer the resource
			const offerData = {
				sellerId: userId, // The user "sells" the resource to the system
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Free, because this is an exchange of resources for an upgrade
				currency: 'tonToken', // The currency is not important, because the price is 0
				offerType: 'SYSTEM',
			};

			// Check that the resource is available
			await this.checkResourceAvailability(
				userId,
				{ type: resource, amount },
				t
			);

			// Lock the resource
			await this.lockResource(userId, { type: resource, amount }, t);

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
	 * Register the transfer of a resource for a task
	 * @param {Object} params { userId, taskId, amount, resource }
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerTaskReward({ userId, taskId, amount, resource }) {
		const t = await sequelize.transaction();

		try {
			// Create an offer from the system to transfer the resource
			const offerData = {
				sellerId: SYSTEM_USER_ID, // The system "sells" the resource to the user
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Free, because this is a reward for a task
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
					txType: 'TASK_RESOURCE',
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
				message:
					'Resource transferred to the user for completing a task',
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
	 * Register the transfer of a resource for farming
	 * @param {Object} params { userId, amount, resource, source }
	 * @returns {Promise<Object>} Result of the operation
	 */
	async registerFarmingReward({ userId, amount, resource, source }) {
		const t = await sequelize.transaction();

		try {
			// Create an offer from the system to transfer the resource
			const offerData = {
				sellerId: SYSTEM_USER_ID, // The system "sells" the resource to the user
				itemType: 'resource',
				itemId: `${resource}_${amount}`,
				price: 0, // Free, because this is a reward for farming
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
					txType: 'FARMING_RESOURCE',
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
				message: 'Resource transferred to the user for farming',
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
	 * Create an offer to sell a resource
	 * @param {number} userId User ID
	 * @param {string} resourceType Resource type
	 * @param {string} price Price
	 * @param {string} currency Currency
	 * @returns {Promise<Object>} Created offer
	 */
	async createResourceOffer(userId, resourceType, amount, price, currency) {
		// Check that for P2P only TON is used
		if (currency !== 'tonToken') {
			throw ApiError.BadRequest(
				'For P2P transactions, only TON can be used'
			);
		}

		// Form the itemId in the format "type_amount"
		const itemId = `${resourceType}_${amount}`;

		// Create an offer with a locked resource
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
	 * Create an invoice (create a transaction and a payment)
	 * @param {Object} params { offerId, buyerId }
	 */
	async createInvoice({ offerId, buyerId }) {
		// Get the offer
		const offer = await MarketOffer.findByPk(offerId);
		if (!offer || offer.status !== 'ACTIVE')
			throw new Error('Offer not found or not active');

		// Create a transaction
		const transaction = await MarketTransaction.create({
			offerId: offer.id,
			buyerId,
			sellerId: offer.sellerId,
			status: 'PENDING',
		});

		// Create a payment: buyer -> contract/system
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
	 * Process a deal: check the payment, change the owner of the artifact, complete the deal, update the balances
	 * @param {Object} params { transactionId, blockchainTxId }
	 */
	async processDeal({ transactionId, blockchainTxId }) {
		// Database transaction for atomicity
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

			// Find the payment and confirm it
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

			// Confirm the payment
			payment.status = 'CONFIRMED';
			payment.blockchainTxId = blockchainTxId;
			payment.confirmedAt = new Date();
			await payment.save({ transaction: t });

			// --- MULTI-CURRENCY UPDATE BALANCES ---
			const currencyMap = {
				stardust: 'stardustCount',
				darkMatter: 'darkMatterCount',
				tgStars: 'tgStarsCount',
				tonToken: 'tokenTonsCount',
			};
			const balanceField = currencyMap[offer.currency];
			if (!balanceField) throw new Error('Unknown currency');

			const price = Number(offer.price);

			// Get the state of SYSTEM (contract) - funds are credited to the contract
			const systemState = await UserState.findOne({
				where: { userId: SYSTEM_USER_ID },
				transaction: t,
			});
			if (!systemState) throw new Error('System user state not found');
			if (typeof systemState.state[balanceField] !== 'number')
				systemState.state[balanceField] = 0;

			// Credit funds to the contract
			systemState.state[balanceField] += price;
			await systemState.save({ transaction: t });

			// Get the state of the buyer
			const buyerState = await UserState.findOne({
				where: { userId: transaction.buyerId },
				transaction: t,
			});
			if (!buyerState) throw new Error('Buyer state not found');

			if (offer.itemType === 'package') {
				// Logic for packages
				const pkg = await PackageStore.findByPk(offer.itemId, {
					transaction: t,
				});
				if (!pkg) throw new Error('Package not found');

				// Add game currency to the buyer
				const gameField = currencyMap[pkg.resource];
				if (!gameField) throw new Error('Unknown game currency');
				if (typeof buyerState.state[gameField] !== 'number')
					buyerState.state[gameField] = 0;
				buyerState.state[gameField] += Number(pkg.amount);

				await buyerState.save({ transaction: t });

				// Create a transaction contract -> buyer (game currency)
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

				// Complete the deal (the offer remains active for SYSTEM packages)
				transaction.status = 'COMPLETED';
				transaction.completedAt = new Date();
				await transaction.save({ transaction: t });

				return { transaction, offer, package: pkg };
			} else {
				// Logic for normal deals (artifacts, galaxies)
				const commissionRate = await getCommissionRate(offer.currency);
				const commission =
					Math.floor(price * commissionRate * 100) / 100;
				const sellerAmount = price - commission;

				// Transfer the artifact to the new owner
				if (offer.itemType === 'artifact') {
					const artifact = await Artifact.findByPk(offer.itemId, {
						transaction: t,
					});
					if (!artifact) throw new Error('Artifact not found');
					artifact.userId = transaction.buyerId;
					await artifact.save({ transaction: t });
				}

				// Transfer the galaxy to the new owner
				if (offer.itemType === 'galaxy') {
					const galaxy = await Galaxy.findByPk(offer.itemId, {
						transaction: t,
					});
					if (!galaxy) throw new Error('Galaxy not found');
					galaxy.userId = transaction.buyerId;
					await galaxy.save({ transaction: t });
				}

				// Complete the deal and the offer
				transaction.status = 'COMPLETED';
				transaction.completedAt = new Date();
				await transaction.save({ transaction: t });
				offer.status = 'COMPLETED';
				await offer.save({ transaction: t });

				// Transfer the contract to the seller (with the commission)
				const sellerState = await UserState.findOne({
					where: { userId: transaction.sellerId },
					transaction: t,
				});
				if (!sellerState) throw new Error('Seller state not found');
				if (typeof sellerState.state[balanceField] !== 'number')
					sellerState.state[balanceField] = 0;

				// Deduct the amount from the contract from the seller
				systemState.state[balanceField] -= sellerAmount;
				// Credit the seller
				sellerState.state[balanceField] += sellerAmount;

				await systemState.save({ transaction: t });
				await sellerState.save({ transaction: t });

				// The commission remains on the contract (systemState)

				// Create a transaction contract -> seller
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

				// Create a transaction for the commission
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
	 * Get all active offers
	 */
	async getAllOffers(userId) {
		const t = await sequelize.transaction();

		try {
			const offers = await MarketOffer.findAll({
				where: {
					status: 'ACTIVE',
					sellerId: { [Op.ne]: userId },
				},
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
	 * Get all transactions of the user (as a buyer or seller)
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
	 * Get system package offers and initialize the user's packages
	 * @param {number} userId - User ID (optional)
	 * @returns {Promise<Array>} - List of system package offers
	 */
	async getPackageOffers(userId = null) {
		const t = await sequelize.transaction();

		try {
			// Get system package offers
			const offers = await MarketOffer.findAll({
				where: {
					itemType: 'package',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
				},
				transaction: t,
			});

			// If the user ID is specified, initialize the packages based on active templates
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
			// Check and limit the limit
			limit = Math.min(limit, pagination.maxLimit);

			// Calculate the offset for pagination
			const offset = (page - 1) * limit;

			// Form the conditions of the request
			const where = {
				itemType: 'artifact',
			};

			if (status) {
				where.status = status;
			} else {
				// By default, only active offers are shown
				where.status = 'ACTIVE';
			}

			if (currency) {
				where.currency = currency;
			}

			// Get offers with pagination
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

			// If the filter by rarity is specified, get the artifacts and filter
			let filteredOffers = offers;
			if (rarity) {
				// Get the artifact IDs from the offers
				const artifactIds = offers.map((offer) => offer.itemId);

				// Get the artifacts with the specified rarity
				const artifacts = await Artifact.findAll({
					where: {
						id: { [Op.in]: artifactIds },
						rarity,
					},
					transaction: t,
				});

				// Filter the offers by the found artifacts
				const artifactIdSet = new Set(artifacts.map((a) => a.id));
				filteredOffers = offers.filter((offer) =>
					artifactIdSet.has(offer.itemId)
				);
			}

			// Get the total number of offers after filtering
			const count = filteredOffers.length;

			// Calculate the total number of pages
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
	 * Get a list of P2P offers with pagination
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
	 * Get a list of system offers with pagination
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
			// Get the offer
			const offer = await MarketOffer.findByPk(offerId);

			if (!offer) {
				throw ApiError.BadRequest('Offer not found');
			}

			// Check the status of the offer
			if (offer.status !== 'ACTIVE') {
				throw ApiError.BadRequest(
					'Offer is not available for purchase'
				);
			}

			// Check that the buyer is not the seller
			if (offer.sellerId === buyerId) {
				throw ApiError.BadRequest('You cannot buy your own offer');
			}

			// Get the state of the buyer
			const buyerState = await UserState.findOne({
				where: { userId: buyerId },
			});

			if (!buyerState) {
				throw ApiError.BadRequest('Buyer state not found');
			}

			// Check that the buyer has enough currency
			const totalPrice = Number(offer.price) * amount;

			if (
				offer.currency === 'tgStars' &&
				buyerState.tgStars < totalPrice
			) {
				throw ApiError.BadRequest('Insufficient TG Stars for purchase');
			} else if (
				offer.currency === 'tonToken' &&
				buyerState.tonToken < totalPrice
			) {
				throw ApiError.BadRequest('Insufficient TON for purchase');
			}

			// If this is a system offer with a package, process it specially
			if (offer.offerType === 'SYSTEM' && offer.itemType === 'package') {
				// Get the package template
				const template = await PackageTemplate.findByPk(offer.itemId);

				if (!template) {
					throw ApiError.BadRequest('Package template not found');
				}

				// Create a package for the user
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

				// Deduct the currency from the buyer
				if (offer.currency === 'tgStars') {
					buyerState.tgStars -= totalPrice;
				} else if (offer.currency === 'tonToken') {
					buyerState.tonToken -= totalPrice;
				}

				await buyerState.save({ transaction });

				// Create a transaction
				await MarketTransaction.create(
					{
						offerId,
						buyerId,
						sellerId: offer.sellerId,
						price: offer.price,
						amount,
						currency: offer.currency,
						itemType: offer.itemType,
						itemId: packageId, // Use the ID of the new package
						status: 'COMPLETED',
					},
					{ transaction }
				);

				await transaction.commit();

				return {
					success: true,
					message: 'Package successfully purchased',
				};
			}

			// Normal offer - standard processing
			// Deduct the currency from the buyer
			if (offer.currency === 'tgStars') {
				buyerState.tgStars -= totalPrice;
			} else if (offer.currency === 'tonToken') {
				buyerState.tonToken -= totalPrice;
			}

			await buyerState.save({ transaction });

			// Transfer the ownership of the item
			await this.transferItemOwnership(offer, buyerId, transaction);

			// Create a transaction
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

			// Update the status of the offer
			await offer.update(
				{
					status: 'COMPLETED',
					isItemLocked: false,
				},
				{ transaction }
			);

			await transaction.commit();

			return { success: true, message: 'Offer successfully purchased' };
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

	async registerGalaxyOffer(offerData, transaction) {
		const t = transaction || (await sequelize.transaction());
		const externalTransaction = !!transaction;
		try {
			const offer = await MarketOffer.create(
				{
					buyerId: offerData.buyerId,
					sellerId: SYSTEM_USER_ID,
					status: 'COMPLETED',
					isItemLocked: true,
					expiresAt: null,
					price: offerData.price,
					currency: offerData.currency,
					offerType: 'SYSTEM',
					amount: offerData.stars,
					itemType: offerData.itemType,
					itemId: offerData.itemId,
				},
				{ transaction }
			);

			await offer.save({ transaction });
			logger.debug('offer created');

			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: offerData.buyerId,
					sellerId: SYSTEM_USER_ID,
					status: 'COMPLETED',
				},
				{ transaction }
			);
			logger.debug('marketTransaction created');
			const payment = await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: offerData.buyerId,
					toAccount: SYSTEM_USER_ID,
					amount: offerData.price,
					currency: offerData.currency,
					txType: 'BUYER_TO_CONTRACT',
					status: 'CONFIRMED',
				},
				{ transaction }
			);
			logger.debug('payment created');
			const transferStars = await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: SYSTEM_USER_ID,
					toAccount: offerData.buyerId,
					amount: offerData.stars,
					currency: 'stars',
					txType: 'STARS_TRANSFER',
					status: 'CONFIRMED',
				},
				{ transaction }
			);
			logger.debug('transferStars created');
		} catch (error) {
			logger.error('Error in registerGalaxyOffer', error);
			if (!externalTransaction) {
				await t.rollback();
			}
			throw error;
		}
		if (!externalTransaction) {
			await t.commit();
			logger.debug('transaction committed');
		}
		return { offer, marketTransaction, payment, transferStars };
	}

	async registerStarsTransfer(offerData, transaction) {
		const t = transaction || (await sequelize.transaction());
		const externalTransaction = !!transaction;
		try {
			const offer = await MarketOffer.create(
				{
					buyerId: offerData.buyerId,
					sellerId: offerData.buyerId,
					status: 'COMPLETED',
					isItemLocked: true,
					expiresAt: null,
					price: offerData.price,
					currency: offerData.currency,
					offerType: 'PERSONAL',
					amount: offerData.amount,
					itemType: offerData.itemType,
					itemId: offerData.itemId,
				},
				{ transaction }
			);

			await offer.save({ transaction });
			logger.debug('offer created');

			const marketTransaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: offerData.buyerId,
					sellerId: offerData.sellerId,
					status: 'COMPLETED',
				},
				{ transaction }
			);
			logger.debug('marketTransaction created');
			const payment = await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: offerData.buyerId,
					toAccount: offerData.sellerId,
					amount: offerData.price,
					currency: offerData.currency,
					txType: 'RESOURCE_TRANSFER',
					status: 'CONFIRMED',
				},
				{ transaction }
			);
			logger.debug('payment created');
			const transferStars = await PaymentTransaction.create(
				{
					marketTransactionId: marketTransaction.id,
					fromAccount: offerData.sellerId,
					toAccount: offerData.buyerId,
					amount: offerData.amount,
					currency: 'stars',
					txType: 'STARS_TRANSFER',
					status: 'CONFIRMED',
				},
				{ transaction }
			);
			logger.debug('transferStars created');
		} catch (error) {
			logger.error('Error in registerStarsTransfer', error);
			if (!externalTransaction) {
				await t.rollback();
			}
			throw error;
		}
		if (!externalTransaction) {
			await t.commit();
			logger.debug('transaction committed');
		}
		return { offer, marketTransaction, payment, transferStars };
	}
}

module.exports = new MarketService();
