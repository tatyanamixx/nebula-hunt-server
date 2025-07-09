'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('gameevents', {
			id: {
				type: Sequelize.STRING(20),
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Localized event descriptions',
			},
			type: {
				type: Sequelize.ENUM(
					'RANDOM',
					'PERIODIC',
					'ONE_TIME',
					'CONDITIONAL',
					'CHAINED',
					'TRIGGERED_BY_ACTION',
					'GLOBAL_TIMED',
					'LIMITED_REPEATABLE',
					'SEASONAL',
					'PASSIVE'
				),
				allowNull: false,
			},
			triggerConfig: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Dynamic trigger logic depending on type',
			},
			effect: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: 'Effect configuration (multiplier, duration, etc)',
			},
			frequency: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Frequency settings for RANDOM and PERIODIC events',
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Conditions that must be met for the event to trigger',
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
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
		await queryInterface.dropTable('gameevents');
	},
};
