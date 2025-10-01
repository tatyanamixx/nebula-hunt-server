"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Check if category column already exists
		const tableDescription = await queryInterface.describeTable("tasktemplates");

		if (!tableDescription.category) {
			// Add category column to tasktemplates table
			await queryInterface.addColumn("tasktemplates", "category", {
				type: Sequelize.STRING,
				allowNull: true,
				defaultValue: "general",
				comment:
					"Task category for grouping (daily, stardust, darkMatter, etc.)",
			});
		}

		// Add index for category
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS tasktemplate_category_idx ON tasktemplates ("category");
		`);
	},

	async down(queryInterface, Sequelize) {
		// Remove index
		await queryInterface.sequelize.query(`
			DROP INDEX IF EXISTS tasktemplate_category_idx;
		`);

		// Remove category column
		await queryInterface.removeColumn("tasktemplates", "category");
	},
};
