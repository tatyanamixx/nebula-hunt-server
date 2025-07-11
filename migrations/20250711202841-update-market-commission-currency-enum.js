'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Update the enum for marketcommissions.currency to include stardust and darkMatter
		await queryInterface.sequelize.query(`
      ALTER TYPE "enum_marketcommissions_currency" ADD VALUE 'stardust';
    `);

		await queryInterface.sequelize.query(`
      ALTER TYPE "enum_marketcommissions_currency" ADD VALUE 'darkMatter';
    `);
	},

	async down(queryInterface, Sequelize) {
		// Note: PostgreSQL doesn't support removing enum values directly
		// This would require recreating the enum type, which is complex
		// For now, we'll leave this as a comment
		console.log('Warning: Cannot easily remove enum values in PostgreSQL');
	},
};
