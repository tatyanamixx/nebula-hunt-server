'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('upgradenodes', {
			id: {
				type: Sequelize.STRING(50),
				primaryKey: true,
				unique: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
			},
			description: {
				type: Sequelize.JSONB,
				defaultValue: {},
			},
			maxLevel: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			basePrice: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			effectPerLevel: {
				type: Sequelize.FLOAT,
				defaultValue: 0,
			},
			priceMultiplier: {
				type: Sequelize.FLOAT,
				defaultValue: 1.0,
			},
			currency: {
				type: Sequelize.ENUM('stardust', 'darkmetter'),
				defaultValue: 'stardust',
			},
			category: {
				type: Sequelize.ENUM(
					'production',
					'economy',
					'special',
					'chance',
					'storage',
					'multiplier'
				),
				defaultValue: 'production',
			},
			icon: {
				type: Sequelize.STRING(3),
				defaultValue: '',
			},
			stability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			instability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			modifiers: {
				type: Sequelize.JSONB,
				defaultValue: {},
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
			},
			delayedUntil: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			children: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
			},
			weight: {
				type: Sequelize.INTEGER,
				defaultValue: 1,
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
		await queryInterface.dropTable('upgradenodes');
	},
};
