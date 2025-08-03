'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу users
		await queryInterface.createTable('users', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				allowNull: false,
			},
			username: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			role: {
				type: Sequelize.ENUM('USER', 'SYSTEM'),
				defaultValue: 'USER',
				allowNull: false,
			},
			referral: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: false,
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			tonWallet: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'TON wallet address of the user',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// 2. Создаем таблицу userstates
		await queryInterface.createTable('userstates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				unique: true,
				allowNull: false,
			},
			stardust: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: false,
			},
			darkMatter: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: false,
			},
			stars: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: false,
			},
			tgStars: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: false,
			},
			tonToken: {
				type: Sequelize.DECIMAL(30, 8),
				defaultValue: 0,
				allowNull: false,
			},
			lastDailyBonus: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			lockedStardust: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: true,
			},
			lockedDarkMatter: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: true,
			},
			lockedStars: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: true,
			},
			playerParameters: {
				type: Sequelize.JSONB,
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
				allowNull: false,
			},
			lastBotNotification: {
				type: Sequelize.JSONB,
				defaultValue: {
					lastBotNotificationTime: null,
					lastBotNotificationToday: {
						date: null,
						count: 0,
					},
				},
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// 3. Создаем таблицу tokens
		await queryInterface.createTable('tokens', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			refreshToken: {
				type: Sequelize.TEXT,
				allowNull: false,
				comment: 'JWT refresh token (может быть длиннее 255 символов)',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Создаем индексы
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS user_referral_idx ON users ("referral");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userstate_user_id_idx ON userstates ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS token_refresh_token_idx ON tokens ("refreshToken");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS token_user_id_idx ON tokens ("userId");
		`);

		// Создаем отложенные внешние ключи через raw SQL
		await queryInterface.sequelize.query(`
			ALTER TABLE userstates 
			ADD CONSTRAINT userstates_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE tokens 
			ADD CONSTRAINT tokens_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем отложенные ограничения
		await queryInterface.removeConstraint('tokens', 'tokens_user_id_fkey');
		await queryInterface.removeConstraint(
			'userstates',
			'userstates_user_id_fkey'
		);

		// Удаляем индексы
		await queryInterface.removeIndex('tokens', 'token_user_id_idx');
		await queryInterface.removeIndex('tokens', 'token_refresh_token_idx');
		await queryInterface.removeIndex('userstates', 'userstate_user_id_idx');
		await queryInterface.removeIndex('users', 'user_referral_idx');

		// Удаляем таблицы
		await queryInterface.dropTable('tokens');
		await queryInterface.dropTable('userstates');
		await queryInterface.dropTable('users');
	},
};
