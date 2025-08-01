'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Demo users
		await queryInterface.bulkInsert(
			'users',
			[
				{
					id: 123456789,
					username: 'demo_user',
					referral: 0,
					role: 'USER',
					blocked: false,
					tonWallet: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 987654321,
					username: 'admin_user',
					referral: 0,
					role: 'USER',
					blocked: false,
					tonWallet: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 555666777,
					username: 'user2',
					referral: 0,
					role: 'USER',
					blocked: false,
					tonWallet: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);

		// Demo user states
		await queryInterface.bulkInsert(
			'userstates',
			[
				{
					id: 1,
					userId: 123456789,
					stardust: 1000,
					darkMatter: 50,
					stars: 100,
					lastDailyBonus: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
					lockedStardust: 0,
					lockedDarkMatter: 0,
					lockedStars: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: 987654321,
					stardust: 5000,
					darkMatter: 200,
					stars: 500,
					lastDailyBonus: new Date(),
					lockedStardust: 0,
					lockedDarkMatter: 0,
					lockedStars: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					userId: 555666777,
					stardust: 0,
					darkMatter: 0,
					stars: 0,
					lastDailyBonus: null,
					lockedStardust: 0,
					lockedDarkMatter: 0,
					lockedStars: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('userstates', null, {});
		await queryInterface.bulkDelete('users', null, {});
	},
};
