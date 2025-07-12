'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Market commissions
		await queryInterface.bulkInsert(
			'marketcommissions',
			[
				{
					id: 1,
					currency: 'tgStars',
					rate: 0.05, // 5% commission
					description: 'Commission for TG Stars transactions',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					currency: 'tonToken',
					rate: 0.03, // 3% commission
					description: 'Commission for TON Token transactions',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					currency: 'stardust',
					rate: 0.02, // 2% commission
					description: 'Commission for Stardust transactions',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					currency: 'darkMatter',
					rate: 0.01, // 1% commission
					description: 'Commission for Dark Matter transactions',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('marketcommissions', null, {});
	},
};
