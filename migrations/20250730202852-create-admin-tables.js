'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу admins
		await queryInterface.createTable('admins', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			password: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			google_id: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: true,
			},
			google2faSecret: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'Google 2FA secret (base32)',
			},
			role: {
				type: Sequelize.ENUM('ADMIN', 'SUPERVISOR'),
				defaultValue: 'ADMIN',
				allowNull: false,
			},
			is_superadmin: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			is_2fa_enabled: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			passwordChangedAt: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Дата последнего изменения пароля',
			},
			passwordExpiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Дата истечения срока действия пароля',
			},
			lastLoginAt: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Дата последнего входа',
			},
			loginAttempts: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
				comment: 'Количество неудачных попыток входа',
			},
			lockedUntil: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Время блокировки аккаунта после неудачных попыток',
			},
			passwordExpiryNotified: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
				comment: 'Флаг отправки уведомления об истечении пароля',
			},
			isLocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
				comment: 'Флаг блокировки аккаунта из-за истекшего пароля',
			},
			lastPasswordChange: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Дата последней смены пароля',
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

		// Индексы для admins
		await queryInterface.addIndex('admins', ['email'], {
			name: 'admins_email_idx',
		});
		await queryInterface.addIndex('admins', ['google_id'], {
			name: 'admins_google_id_idx',
		});

		// 2. Создаем таблицу admintokens
		await queryInterface.createTable('admintokens', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			adminId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'admins',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			refreshToken: {
				type: Sequelize.TEXT,
				allowNull: false,
				comment:
					'JWT refresh token для админов (может быть длиннее 255 символов)',
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

		// Индексы для admintokens
		await queryInterface.addIndex('admintokens', ['refreshToken'], {
			name: 'admintoken_refresh_token_idx',
		});
		await queryInterface.addIndex('admintokens', ['adminId'], {
			name: 'admintoken_admin_id_idx',
		});

		// 3. Создаем таблицу admininvites
		await queryInterface.createTable('admininvites', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			adminId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'admins',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			role: {
				type: Sequelize.ENUM('ADMIN', 'SUPERVISOR'),
				defaultValue: 'ADMIN',
				allowNull: false,
			},
			token: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			used: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			usedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			usedBy: {
				type: Sequelize.BIGINT,
				allowNull: true,
			},
			expiresAt: {
				type: Sequelize.DATE,
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

		// Индексы для admininvites
		await queryInterface.addIndex('admininvites', ['email'], {
			name: 'admininvite_email_idx',
		});
		await queryInterface.addIndex('admininvites', ['adminId'], {
			name: 'admininvite_admin_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('admininvites');
		await queryInterface.dropTable('admintokens');
		await queryInterface.dropTable('admins');
	},
};
