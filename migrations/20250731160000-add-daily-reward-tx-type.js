'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		// Add DAILY_REWARD to the txType enum in paymenttransactions table
		await queryInterface.sequelize.query(`
			ALTER TYPE "enum_paymenttransactions_txType" ADD VALUE 'DAILY_REWARD';
		`);
	},

	async down(queryInterface, Sequelize) {
		// Note: PostgreSQL doesn't support removing enum values directly
		// This would require recreating the enum type, which is complex
		// For now, we'll leave the enum value in place
		console.log('Warning: Cannot remove enum value DAILY_REWARD from txType enum');
	},
}; 