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
				defaultValue: false,
				allowNull: false,
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

		// Создаем индексы
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admin_email_idx ON admins ("email");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admin_google_id_idx ON admins ("google_id");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admintoken_refresh_token_idx ON admintokens ("refreshToken");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admintoken_admin_id_idx ON admintokens ("adminId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admininvite_email_idx ON admininvites ("email");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admininvite_admin_id_idx ON admininvites ("adminId");
		`);

		// Создаем отложенные внешние ключи
		await queryInterface.sequelize.query(`
			ALTER TABLE admintokens 
			ADD CONSTRAINT admintokens_admin_id_fkey 
			FOREIGN KEY ("adminId") 
			REFERENCES admins(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE admininvites 
			ADD CONSTRAINT admininvites_admin_id_fkey 
			FOREIGN KEY ("adminId") 
			REFERENCES admins(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE admininvites 
			ADD CONSTRAINT admininvites_used_by_fkey 
			FOREIGN KEY ("usedBy") 
			REFERENCES admins(id) 
			ON UPDATE CASCADE 
			ON DELETE SET NULL 
			DEFERRABLE INITIALLY DEFERRED;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем отложенные ограничения
		await queryInterface.removeConstraint(
			'admininvites',
			'admininvites_used_by_fkey'
		);
		await queryInterface.removeConstraint(
			'admininvites',
			'admininvites_admin_id_fkey'
		);
		await queryInterface.removeConstraint(
			'admintokens',
			'admintokens_admin_id_fkey'
		);

		// Удаляем индексы
		await queryInterface.removeIndex(
			'admininvites',
			'admininvite_admin_id_idx'
		);
		await queryInterface.removeIndex(
			'admininvites',
			'admininvite_email_idx'
		);
		await queryInterface.removeIndex(
			'admintokens',
			'admintoken_admin_id_idx'
		);
		await queryInterface.removeIndex(
			'admintokens',
			'admintoken_refresh_token_idx'
		);
		await queryInterface.removeIndex('admins', 'admin_google_id_idx');
		await queryInterface.removeIndex('admins', 'admin_email_idx');

		// Удаляем таблицы
		await queryInterface.dropTable('admininvites');
		await queryInterface.dropTable('admintokens');
		await queryInterface.dropTable('admins');
	},
};
