"use strict";

module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Добавляем поле metadata в таблицу paymenttransactions
		await queryInterface.addColumn("paymenttransactions", "metadata", {
			type: Sequelize.JSONB,
			allowNull: true,
			comment:
				"Дополнительная информация о транзакции (например, день стрика для ежедневных заданий)",
		});

		// 2. Добавляем новое значение в ENUM для txType
		// В PostgreSQL нужно использовать ALTER TYPE
		await queryInterface.sequelize.query(`
			ALTER TYPE "enum_paymenttransactions_txType" 
			ADD VALUE IF NOT EXISTS 'DAILY_TASK_REWARD';
		`);
	},

	async down(queryInterface, Sequelize) {
		// 1. Удаляем поле metadata
		await queryInterface.removeColumn("paymenttransactions", "metadata");

		// 2. Удаление значения из ENUM в PostgreSQL невозможно без пересоздания типа
		// Оставляем как есть, так как это не критично
		console.log(
			"Note: DAILY_TASK_REWARD value cannot be removed from ENUM without recreating the type"
		);
	},
};
