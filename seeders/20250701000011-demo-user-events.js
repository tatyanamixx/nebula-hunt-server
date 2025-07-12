'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Demo user events
		await queryInterface.bulkInsert(
			'userevents',
			[
				{
					id: 1,
					userId: 123456789,
					eventId: 'daily_reward',
					status: 'COMPLETED',
					triggeredAt: new Date(Date.now() - 86400000),
					expiresAt: new Date(Date.now() - 82800000),
					effects: {
						reward: {
							stardust: 50,
						},
					},
					progress: {
						collected: true,
					},
					completedAt: new Date(Date.now() - 82800000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: 123456789,
					eventId: 'solar_flare',
					status: 'ACTIVE',
					triggeredAt: new Date(Date.now() - 300000),
					expiresAt: new Date(Date.now() + 180000),
					effects: {
						multipliers: {
							cps: 1.25,
						},
					},
					progress: {
						active: true,
					},
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					userId: 987654321,
					eventId: 'daily_reward',
					status: 'COMPLETED',
					triggeredAt: new Date(Date.now() - 43200000),
					expiresAt: new Date(Date.now() - 39600000),
					effects: {
						reward: {
							stardust: 50,
						},
					},
					progress: {
						collected: true,
					},
					completedAt: new Date(Date.now() - 39600000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					userId: 987654321,
					eventId: 'cosmic_harvest',
					status: 'COMPLETED',
					triggeredAt: new Date(Date.now() - 43200000),
					expiresAt: new Date(Date.now() - 39600000),
					effects: {
						reward: {
							stardust: 100,
							darkMatter: 5,
						},
					},
					progress: {
						collected: true,
					},
					completedAt: new Date(Date.now() - 39600000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 5,
					userId: 987654321,
					eventId: 'galaxy_storm',
					status: 'EXPIRED',
					triggeredAt: new Date(Date.now() - 1800000),
					expiresAt: new Date(Date.now() - 900000),
					effects: {
						multipliers: {
							stardust: 1.5,
							darkMatter: 1.3,
						},
					},
					progress: {
						active: false,
					},
					completedAt: new Date(Date.now() - 900000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);

		// Demo user event settings
		await queryInterface.bulkInsert(
			'usereventsettings',
			[
				{
					id: 1,
					userId: 123456789,
					eventMultipliers: {
						production: 1.0,
						chaos: 1.0,
						stability: 1.0,
						entropy: 1.0,
						rewards: 1.0,
					},
					lastEventCheck: new Date(),
					eventCooldowns: {
						daily_reward: new Date(Date.now() + 86400000),
						solar_flare: new Date(Date.now() + 3600000),
					},
					enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
					disabledEvents: [],
					priorityEvents: ['daily_reward'],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: 987654321,
					eventMultipliers: {
						production: 1.2,
						chaos: 1.0,
						stability: 1.1,
						entropy: 1.0,
						rewards: 1.15,
					},
					lastEventCheck: new Date(),
					eventCooldowns: {
						daily_reward: new Date(Date.now() + 43200000),
						cosmic_harvest: new Date(Date.now() + 43200000),
						galaxy_storm: new Date(Date.now() + 86400000),
					},
					enabledTypes: [
						'RANDOM',
						'PERIODIC',
						'CONDITIONAL',
						'CHAINED',
					],
					disabledEvents: ['chaos_spike'],
					priorityEvents: ['daily_reward', 'cosmic_harvest'],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('usereventsettings', null, {});
		await queryInterface.bulkDelete('userevents', null, {});
	},
};
