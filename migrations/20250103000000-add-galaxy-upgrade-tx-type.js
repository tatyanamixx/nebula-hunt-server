"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(`
			ALTER TYPE "enum_paymenttransactions_txType"
			ADD VALUE IF NOT EXISTS 'GALAXY_UPGRADE';
		`);
	},

	async down(queryInterface, Sequelize) {
		console.log(
			"Cannot remove enum values in PostgreSQL. Manual intervention required if rollback is needed."
		);
	},
};

