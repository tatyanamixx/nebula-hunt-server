'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Demo market offers
		await queryInterface.bulkInsert(
			'marketoffers',
			[
				{
					id: 1,
					sellerId: 123456789,
					itemType: 'artifact',
					itemId: '1',
					price: 100.0,
					currency: 'tgStars',
					status: 'ACTIVE',
					offerType: 'P2P',
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
					isItemLocked: true,
					updatedAt: new Date(),
				},
				{
					id: 2,
					sellerId: 123456789,
					itemType: 'galaxy',
					itemId: '1',
					price: 500.0,
					currency: 'tgStars',
					status: 'ACTIVE',
					offerType: 'P2P',
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
					isItemLocked: true,
					updatedAt: new Date(),
				},
				{
					id: 3,
					sellerId: 987654321,
					itemType: 'artifact',
					itemId: '3',
					price: 2.5,
					currency: 'tonToken',
					status: 'ACTIVE',
					offerType: 'P2P',
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
					isItemLocked: true,
					updatedAt: new Date(),
				},
				{
					id: 4,
					sellerId: 555666777, // System user
					itemType: 'artifact',
					itemId: '4',
					price: 50.0,
					currency: 'tgStars',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
					isItemLocked: false,
					updatedAt: new Date(),
				},
				{
					id: 5,
					sellerId: 555666777, // System user
					itemType: 'artifact',
					itemId: '5',
					price: 1000.0,
					currency: 'tgStars',
					status: 'ACTIVE',
					offerType: 'SYSTEM',
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
					isItemLocked: false,
					updatedAt: new Date(),
				},
				{
					id: 6,
					sellerId: 123456789,
					itemType: 'resource',
					itemId: 'stardust_1000',
					price: 10.0,
					currency: 'tgStars',
					status: 'COMPLETED',
					offerType: 'P2P',
					createdAt: new Date(Date.now() - 86400000), // 1 day ago
					expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
					isItemLocked: false,
					updatedAt: new Date(),
				},
			],
			{}
		);

		// Demo market transactions
		await queryInterface.bulkInsert(
			'markettransactions',
			[
				{
					id: 1,
					offerId: 6,
					buyerId: 987654321,
					sellerId: 123456789,
					status: 'COMPLETED',
					createdAt: new Date(Date.now() - 43200000), // 12 hours ago
					completedAt: new Date(Date.now() - 43100000),
					updatedAt: new Date(),
				},
			],
			{}
		);

		// Demo payment transactions
		await queryInterface.bulkInsert(
			'paymenttransactions',
			[
				{
					id: 1,
					marketTransactionId: 1,
					fromAccount: 987654321,
					toAccount: 123456789,
					amount: 9.5, // After 5% commission
					currency: 'tgStars',
					txType: 'BUYER_TO_CONTRACT',
					blockchainTxId: 'tx_123456789',
					status: 'CONFIRMED',
					createdAt: new Date(Date.now() - 43200000),
					confirmedAt: new Date(Date.now() - 43100000),
					updatedAt: new Date(),
				},
				{
					id: 2,
					marketTransactionId: 1,
					fromAccount: 123456789,
					toAccount: 987654321,
					amount: 10.0,
					currency: 'tgStars',
					txType: 'CONTRACT_TO_SELLER',
					blockchainTxId: 'tx_987654321',
					status: 'CONFIRMED',
					createdAt: new Date(Date.now() - 43100000),
					confirmedAt: new Date(Date.now() - 43000000),
					updatedAt: new Date(),
				},
				{
					id: 3,
					marketTransactionId: 1,
					fromAccount: 987654321,
					toAccount: 555666777, // System account for fees
					amount: 0.5,
					currency: 'tgStars',
					txType: 'FEE',
					blockchainTxId: 'tx_fee_001',
					status: 'CONFIRMED',
					createdAt: new Date(Date.now() - 43100000),
					confirmedAt: new Date(Date.now() - 43000000),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('paymenttransactions', null, {});
		await queryInterface.bulkDelete('markettransactions', null, {});
		await queryInterface.bulkDelete('marketoffers', null, {});
	},
};
