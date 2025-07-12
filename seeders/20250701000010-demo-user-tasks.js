'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Demo user tasks
		await queryInterface.bulkInsert(
			'usertasks',
			[
				{
					id: 1,
					userId: 123456789,
					taskId: 'create_stars_100',
					progress: 150,
					targetProgress: 100,
					completed: true,
					reward: 500,
					progressHistory: [
						{
							progress: 50,
							timestamp: new Date(Date.now() - 86400000),
						},
						{
							progress: 100,
							timestamp: new Date(Date.now() - 43200000),
						},
						{ progress: 150, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					active: true,
					completedAt: new Date(Date.now() - 43200000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: 123456789,
					taskId: 'create_stars_1000',
					progress: 400,
					targetProgress: 1000,
					completed: false,
					reward: 2000,
					progressHistory: [
						{
							progress: 100,
							timestamp: new Date(Date.now() - 86400000),
						},
						{
							progress: 250,
							timestamp: new Date(Date.now() - 43200000),
						},
						{ progress: 400, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					active: true,
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					userId: 123456789,
					taskId: 'collect_stardust_5000',
					progress: 1000,
					targetProgress: 5000,
					completed: false,
					reward: 1000,
					progressHistory: [
						{
							progress: 500,
							timestamp: new Date(Date.now() - 86400000),
						},
						{ progress: 1000, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					active: true,
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					userId: 987654321,
					taskId: 'create_stars_100',
					progress: 100,
					targetProgress: 100,
					completed: true,
					reward: 500,
					progressHistory: [
						{
							progress: 100,
							timestamp: new Date(Date.now() - 172800000),
						},
					],
					lastProgressUpdate: new Date(Date.now() - 172800000),
					active: true,
					completedAt: new Date(Date.now() - 172800000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 5,
					userId: 987654321,
					taskId: 'create_stars_1000',
					progress: 1000,
					targetProgress: 1000,
					completed: true,
					reward: 2000,
					progressHistory: [
						{
							progress: 500,
							timestamp: new Date(Date.now() - 129600000),
						},
						{
							progress: 1000,
							timestamp: new Date(Date.now() - 86400000),
						},
					],
					lastProgressUpdate: new Date(Date.now() - 86400000),
					active: true,
					completedAt: new Date(Date.now() - 86400000),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 6,
					userId: 987654321,
					taskId: 'create_stars_10000',
					progress: 5000,
					targetProgress: 10000,
					completed: false,
					reward: 10000,
					progressHistory: [
						{
							progress: 2000,
							timestamp: new Date(Date.now() - 86400000),
						},
						{
							progress: 3500,
							timestamp: new Date(Date.now() - 43200000),
						},
						{ progress: 5000, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					active: true,
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 7,
					userId: 987654321,
					taskId: 'collect_dark_matter_10',
					progress: 10,
					targetProgress: 10,
					completed: true,
					reward: 5,
					progressHistory: [
						{
							progress: 5,
							timestamp: new Date(Date.now() - 86400000),
						},
						{ progress: 10, timestamp: new Date() },
					],
					lastProgressUpdate: new Date(),
					active: true,
					completedAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 8,
					userId: 987654321,
					taskId: 'own_galaxies_3',
					progress: 1,
					targetProgress: 3,
					completed: false,
					reward: 15,
					progressHistory: [{ progress: 1, timestamp: new Date() }],
					lastProgressUpdate: new Date(),
					active: true,
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('usertasks', null, {});
	},
};
