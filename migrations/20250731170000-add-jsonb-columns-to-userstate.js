'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Add playerParameters JSONB column to userstate table
		await queryInterface.addColumn('userstates', 'playerParameters', {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: {
				stardustProduction: 0,
				starDiscount: 0,
				darkMatterChance: 0,
				stardustMultiplier: 0,
				galaxyExplorer: 0,
				darkMatterSynthesis: 0,
				bulkCreation: 0,
				stellarMarket: 0,
				cosmicHarmony: 0,
				overflowProtection: 0,
				quantumInstability: 0,
				voidResonance: 0,
				stellarForge: 0,
			},
		});

		// Add lastBotNotification JSONB column to userstate table
		await queryInterface.addColumn('userstates', 'lastBotNotification', {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: {
				lastBotNotificationTime: null,
				lastBotNotificationToday: {
					date: null,
					count: 0,
				},
			},
		});
	},

	async down(queryInterface, Sequelize) {
		// Remove the columns in reverse order
		await queryInterface.removeColumn('userstates', 'lastBotNotification');
		await queryInterface.removeColumn('userstates', 'playerParameters');
	},
};
