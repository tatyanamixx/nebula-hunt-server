'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('paymenttransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			marketTransactionId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			fromAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			toAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			amount: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM(
					'tgStars',
					'stardust',
					'darkMatter',
					'tonToken'
				),
				allowNull: false,
			},
			txType: {
				type: Sequelize.ENUM(
					'BUYER_TO_CONTRACT',
					'CONTRACT_TO_SELLER',
					'FEE',
					'FARMING_REWARD',
					'UPGRADE_PAYMENT',
					'TASK_REWARD',
					'EVENT_REWARD',
					'GALAXY_STARS_TRANSFER',
					'RESOURCE_EXCHANGE'
				),
				allowNull: false,
			},
			blockchainTxId: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			status: {
				type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
				defaultValue: 'PENDING',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			confirmedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('paymenttransactions');
	},
};
