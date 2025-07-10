'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('users', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				allowNull: false,
				defaultValue: 0,
			},
			username: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			password: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			tonWallet: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'TON wallet address of the user',
			},
			referral: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
			},
			role: {
				type: Sequelize.ENUM('USER', 'ADMIN', 'SYSTEM'),
				defaultValue: 'USER',
				allowNull: false,
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			google2faSecret: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'Google 2FA secret (base32)',
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
		await queryInterface.addIndex('users', ['referral'], {
			name: 'user_referral_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('users');
	},
};
