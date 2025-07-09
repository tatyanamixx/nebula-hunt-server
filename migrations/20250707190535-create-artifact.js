'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('artifacts', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
			},
			rarity: {
				type: Sequelize.ENUM(
					'COMMON',
					'UNCOMMON',
					'RARE',
					'EPIC',
					'LEGENDARY'
				),
				defaultValue: 'COMMON',
			},
			image: {
				type: Sequelize.STRING,
			},
			effects: {
				type: Sequelize.JSONB,
				defaultValue: {},
			},
			tradable: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: true,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('artifacts');
	},
};
