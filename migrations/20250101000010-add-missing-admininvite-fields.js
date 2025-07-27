/**
 * Migration: Add missing fields to admininvites table
 * created by Claude on 15.07.2025
 */

'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			// Добавляем поле used
			await queryInterface.addColumn('admininvites', 'used', {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			});

			// Добавляем поле usedBy
			await queryInterface.addColumn('admininvites', 'usedBy', {
				type: Sequelize.BIGINT,
				allowNull: true,
			});

			// Обновляем существующие записи, устанавливая used = true если usedAt не null
			await queryInterface.sequelize.query(
				`UPDATE admininvites SET "used" = true WHERE "usedAt" IS NOT NULL`
			);

			console.log('✅ Added missing fields to admininvites table');
		} catch (error) {
			console.error('❌ Migration error:', error.message);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			// Удаляем добавленные поля
			await queryInterface.removeColumn('admininvites', 'used');
			await queryInterface.removeColumn('admininvites', 'usedBy');

			console.log('✅ Removed fields from admininvites table');
		} catch (error) {
			console.error('❌ Migration rollback error:', error.message);
			throw error;
		}
	},
};
