/**
 * Migration: Update Admin and AdminInvite models for new auth system
 * created by Claude on 15.07.2025
 */

'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			// Добавляем колонки в таблицу admins
			await queryInterface.addColumn('admins', 'name', {
				type: Sequelize.STRING,
				allowNull: true,
			});

			await queryInterface.addColumn('admins', 'password', {
				type: Sequelize.STRING,
				allowNull: true,
			});

			// Добавляем колонки в таблицу admininvites
			await queryInterface.addColumn('admininvites', 'name', {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: 'Admin',
			});

			await queryInterface.addColumn('admininvites', 'role', {
				type: Sequelize.ENUM('ADMIN', 'SUPERVISOR'),
				allowNull: false,
				defaultValue: 'ADMIN',
			});

			// Добавляем колонку expiresAt без defaultValue
			await queryInterface.addColumn('admininvites', 'expiresAt', {
				type: Sequelize.DATE,
				allowNull: true, // Временно разрешаем null
			});

			// Обновляем существующие записи, устанавливая expiresAt
			await queryInterface.sequelize.query(
				`UPDATE admininvites SET "expiresAt" = NOW() + INTERVAL '7 days' WHERE "expiresAt" IS NULL`
			);

			// Делаем поле NOT NULL после обновления данных
			await queryInterface.changeColumn('admininvites', 'expiresAt', {
				type: Sequelize.DATE,
				allowNull: false,
			});
		} catch (error) {
			console.error('Migration error:', error.message);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			// Удаляем колонки из admins
			await queryInterface.removeColumn('admins', 'name');
			await queryInterface.removeColumn('admins', 'password');

			// Удаляем колонки из admininvites
			await queryInterface.removeColumn('admininvites', 'name');
			await queryInterface.removeColumn('admininvites', 'role');
			await queryInterface.removeColumn('admininvites', 'expiresAt');
		} catch (error) {
			console.error('Migration rollback error:', error.message);
			throw error;
		}
	},
};
