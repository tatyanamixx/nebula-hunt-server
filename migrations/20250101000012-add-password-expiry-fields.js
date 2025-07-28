'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		// Добавляем только недостающие поля
		await queryInterface.addColumn('admins', 'passwordExpiryNotified', {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: 'Флаг отправки уведомления об истечении пароля',
		});

		await queryInterface.addColumn('admins', 'isLocked', {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: 'Флаг блокировки аккаунта из-за истекшего пароля',
		});

		await queryInterface.addColumn('admins', 'lastPasswordChange', {
			type: Sequelize.DATE,
			allowNull: true,
			comment: 'Дата последней смены пароля',
		});

		// Добавляем индексы для оптимизации запросов
		await queryInterface.addIndex('admins', ['passwordExpiresAt'], {
			name: 'idx_admins_password_expires_at',
		});

		await queryInterface.addIndex('admins', ['passwordExpiryNotified'], {
			name: 'idx_admins_password_expiry_notified',
		});

		await queryInterface.addIndex('admins', ['isLocked'], {
			name: 'idx_admins_is_locked',
		});

		// Обновляем существующих админов - устанавливаем дату истечения пароля если её нет
		const expiryDays =
			parseInt(process.env.ADMIN_PASSWORD_EXPIRY_DAYS) || 90;
		const expiryDate = new Date();
		expiryDate.setDate(expiryDate.getDate() + expiryDays);

		await queryInterface.sequelize.query(
			`
      UPDATE admins 
      SET "passwordExpiresAt" = :expiryDate,
          "lastPasswordChange" = NOW()
      WHERE "passwordExpiresAt" IS NULL
    `,
			{
				replacements: { expiryDate },
			}
		);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем индексы
		await queryInterface.removeIndex(
			'admins',
			'idx_admins_password_expires_at'
		);
		await queryInterface.removeIndex(
			'admins',
			'idx_admins_password_expiry_notified'
		);
		await queryInterface.removeIndex('admins', 'idx_admins_is_locked');

		// Удаляем только добавленные колонки
		await queryInterface.removeColumn('admins', 'passwordExpiryNotified');
		await queryInterface.removeColumn('admins', 'isLocked');
		await queryInterface.removeColumn('admins', 'lastPasswordChange');
	},
};
