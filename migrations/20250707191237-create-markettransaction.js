'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('markettransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			offerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			buyerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM(
					'PENDING',
					'COMPLETED',
					'FAILED',
					'CANCELLED'
				),
				defaultValue: 'PENDING',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			completedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('markettransactions');
	},
};
