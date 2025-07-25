/**
 * Migration: Add google_id field to admins table for OAuth
 * created by Claude on 26.07.2025
 */

'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			// Проверяем, существует ли уже колонка google_id
			const tableInfo = await queryInterface.describeTable('admins');

			if (!tableInfo.google_id) {
				// Добавляем колонку google_id
				await queryInterface.addColumn('admins', 'google_id', {
					type: Sequelize.STRING,
					allowNull: true,
					unique: true,
				});

				// Добавляем индекс для google_id
				await queryInterface.addIndex('admins', ['google_id'], {
					name: 'admins_google_id_idx',
				});

				console.log('Added google_id column to admins table');
			} else {
				console.log('google_id column already exists in admins table');
			}
		} catch (error) {
			console.error('Migration error:', error.message);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			// Удаляем индекс
			await queryInterface.removeIndex('admins', 'admins_google_id_idx');

			// Удаляем колонку
			await queryInterface.removeColumn('admins', 'google_id');

			console.log('Removed google_id column from admins table');
		} catch (error) {
			console.error('Migration rollback error:', error.message);
			throw error;
		}
	},
};
