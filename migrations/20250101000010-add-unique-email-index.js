/**
 * Migration: Add unique index on email field for admins table
 * created by Claude on 26.07.2025
 */

'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			// Добавляем уникальный индекс на поле email
			await queryInterface.addIndex('admins', ['email'], {
				unique: true,
				name: 'admins_email_unique',
			});

			console.log('Unique index added to admins.email');
		} catch (error) {
			console.error('Migration error:', error.message);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			// Удаляем уникальный индекс
			await queryInterface.removeIndex('admins', 'admins_email_unique');

			console.log('Unique index removed from admins.email');
		} catch (error) {
			console.error('Migration rollback error:', error.message);
			throw error;
		}
	},
};
