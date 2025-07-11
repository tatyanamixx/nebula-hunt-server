'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create User table
		await queryInterface.createTable('users', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				defaultValue: 0,
			},
			username: {
				type: Sequelize.STRING,
			},
			referral: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
			},
			role: {
				type: Sequelize.ENUM('USER', 'ADMIN', 'SYSTEM'),
				defaultValue: 'USER',
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			google2faSecret: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'Google 2FA secret (base32)',
			},
			tonWallet: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'TON wallet address of the user',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserState table
		await queryInterface.createTable('userstates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				unique: true,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			stardust: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			darkMatter: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			tgStars: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			lastDailyBonus: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			lockedStardust: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			lockedDarkMatter: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			lockedTgStars: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create Token table
		await queryInterface.createTable('tokens', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			refreshToken: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create indexes
		await queryInterface.addIndex('users', ['referral'], {
			name: 'user_referral_idx',
		});

		await queryInterface.addIndex('tokens', ['refreshToken']);
		await queryInterface.addIndex('tokens', ['userId'], {
			name: 'token_user_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable('tokens');
		await queryInterface.dropTable('userstates');
		await queryInterface.dropTable('users');
	},
};
