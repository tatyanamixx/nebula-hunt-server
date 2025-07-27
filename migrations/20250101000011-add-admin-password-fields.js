/**
 * Migration: Add admin password fields
 * created by Claude on 26.07.2025
 */
'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn('admins', 'passwordChangedAt', {
			type: Sequelize.DATE,
			allowNull: true,
			comment: 'Дата последнего изменения пароля',
		});

		await queryInterface.addColumn('admins', 'passwordExpiresAt', {
			type: Sequelize.DATE,
			allowNull: true,
			comment: 'Дата истечения срока действия пароля',
		});

		await queryInterface.addColumn('admins', 'lastLoginAt', {
			type: Sequelize.DATE,
			allowNull: true,
			comment: 'Дата последнего входа',
		});

		await queryInterface.addColumn('admins', 'loginAttempts', {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0,
			comment: 'Количество неудачных попыток входа',
		});

		await queryInterface.addColumn('admins', 'lockedUntil', {
			type: Sequelize.DATE,
			allowNull: true,
			comment: 'Время блокировки аккаунта после неудачных попыток',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeColumn('admins', 'passwordChangedAt');
		await queryInterface.removeColumn('admins', 'passwordExpiresAt');
		await queryInterface.removeColumn('admins', 'lastLoginAt');
		await queryInterface.removeColumn('admins', 'loginAttempts');
		await queryInterface.removeColumn('admins', 'lockedUntil');
	},
};
