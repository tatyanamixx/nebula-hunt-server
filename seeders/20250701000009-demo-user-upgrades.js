'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Demo user upgrades
		await queryInterface.bulkInsert(
			'userupgrades',
			[
				{
					id: 1,
					userId: 123456789,
					upgradeNodeTemplateId: 1, // basic_mining
					level: 3,
					progress: 75,
					targetProgress: 100,
					completed: false,
					stability: 0.0,
					instability: 0.0,
					progressHistory: [
						{
							level: 1,
							progress: 100,
							timestamp: new Date(Date.now() - 86400000),
						},
						{
							level: 2,
							progress: 100,
							timestamp: new Date(Date.now() - 43200000),
						},
						{ level: 3, progress: 75, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: 123456789,
					upgradeNodeTemplateId: 2, // energy_efficiency
					level: 1,
					progress: 50,
					targetProgress: 100,
					completed: false,
					stability: 0.1,
					instability: -0.1,
					progressHistory: [
						{ level: 1, progress: 50, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					userId: 987654321,
					upgradeNodeTemplateId: 1, // basic_mining
					level: 5,
					progress: 100,
					targetProgress: 100,
					completed: true,
					stability: 0.0,
					instability: 0.0,
					progressHistory: [
						{
							level: 1,
							progress: 100,
							timestamp: new Date(Date.now() - 172800000),
						},
						{
							level: 2,
							progress: 100,
							timestamp: new Date(Date.now() - 129600000),
						},
						{
							level: 3,
							progress: 100,
							timestamp: new Date(Date.now() - 86400000),
						},
						{
							level: 4,
							progress: 100,
							timestamp: new Date(Date.now() - 43200000),
						},
						{ level: 5, progress: 100, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					userId: 987654321,
					upgradeNodeTemplateId: 3, // improved_mining
					level: 2,
					progress: 30,
					targetProgress: 100,
					completed: false,
					stability: 0.0,
					instability: 0.1,
					progressHistory: [
						{
							level: 1,
							progress: 100,
							timestamp: new Date(Date.now() - 86400000),
						},
						{ level: 2, progress: 30, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 5,
					userId: 987654321,
					upgradeNodeTemplateId: 2, // energy_efficiency
					level: 3,
					progress: 100,
					targetProgress: 100,
					completed: true,
					stability: 0.3,
					instability: -0.3,
					progressHistory: [
						{
							level: 1,
							progress: 100,
							timestamp: new Date(Date.now() - 172800000),
						},
						{
							level: 2,
							progress: 100,
							timestamp: new Date(Date.now() - 86400000),
						},
						{ level: 3, progress: 100, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('userupgrades', null, {});
	},
};
