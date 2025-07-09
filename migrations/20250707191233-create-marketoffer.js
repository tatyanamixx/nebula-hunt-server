'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('marketoffers', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			itemType: {
				type: Sequelize.ENUM(
					'artifact',
					'galaxy',
					'resource',
					'package'
				),
				allowNull: false,
			},
			itemId: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			price: {
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
			status: {
				type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'),
				defaultValue: 'ACTIVE',
			},
			offerType: {
				type: Sequelize.ENUM('SYSTEM', 'P2P'),
				allowNull: false,
				defaultValue: 'SYSTEM',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('marketoffers');
	},
};
