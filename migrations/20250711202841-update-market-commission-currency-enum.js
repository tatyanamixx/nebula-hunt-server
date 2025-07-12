'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Update the enum for marketcommissions.currency to include stardust and darkMatter
		// Check if values already exist before adding them
		try {
			await queryInterface.sequelize.query(`
        ALTER TYPE "enum_marketcommissions_currency" ADD VALUE 'stardust';
      `);
		} catch (error) {
			if (error.message.includes('already exists')) {
				console.log('stardust enum value already exists, skipping...');
			} else {
				throw error;
			}
		}

		try {
			await queryInterface.sequelize.query(`
        ALTER TYPE "enum_marketcommissions_currency" ADD VALUE 'darkMatter';
      `);
		} catch (error) {
			if (error.message.includes('already exists')) {
				console.log(
					'darkMatter enum value already exists, skipping...'
				);
			} else {
				throw error;
			}
		}
	},

	async down(queryInterface, Sequelize) {
		// Note: PostgreSQL doesn't support removing enum values directly
		// This would require recreating the enum type, which is complex
		// For now, we'll leave this as a comment
		console.log('Warning: Cannot easily remove enum values in PostgreSQL');
	},
};
