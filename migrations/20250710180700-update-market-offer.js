'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Добавляем новый статус EXPIRED в enum
		await queryInterface.sequelize.query(`
      ALTER TYPE "enum_marketoffers_status" ADD VALUE 'EXPIRED' AFTER 'CANCELLED';
    `);

		// Добавляем новое поле isItemLocked
		await queryInterface.addColumn('marketoffers', 'isItemLocked', {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		});

		// Обновляем существующие записи, устанавливая isItemLocked = true для активных оферт
		await queryInterface.sequelize.query(`
      UPDATE "marketoffers" SET "isItemLocked" = true WHERE "status" = 'ACTIVE';
    `);

		// Обновляем существующие записи, устанавливая isItemLocked = false для завершенных или отмененных оферт
		await queryInterface.sequelize.query(`
      UPDATE "marketoffers" SET "isItemLocked" = false WHERE "status" IN ('COMPLETED', 'CANCELLED');
    `);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем поле isItemLocked
		await queryInterface.removeColumn('marketoffers', 'isItemLocked');

		// Удалить значение EXPIRED из enum сложнее, поэтому оставляем его
	},
};
