'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Add UPGRADE_PURCHASE transaction type to the enum
		await queryInterface.sequelize.query(`
			ALTER TYPE "enum_paymenttransactions_txType"
			ADD VALUE IF NOT EXISTS 'UPGRADE_PURCHASE';
		`);
	},

	async down(queryInterface, Sequelize) {
		// Note: PostgreSQL does not support removing enum values
		// You would need to recreate the enum type without these values
		// which would require recreating all dependent columns
		console.log(
			'Cannot remove enum values in PostgreSQL. Manual intervention required if rollback is needed.'
		);
	},
};

