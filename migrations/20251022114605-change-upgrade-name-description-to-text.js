"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Change name column from STRING to TEXT
		await queryInterface.changeColumn("upgradenodetemplates", "name", {
			type: Sequelize.TEXT,
			defaultValue: '{"en": "", "ru": ""}',
			comment: "Localized upgrade node name as JSON string",
		});

		// Change description column from JSONB to TEXT
		await queryInterface.changeColumn("upgradenodetemplates", "description", {
			type: Sequelize.TEXT,
			defaultValue: '{"en": "", "ru": ""}',
			comment: "Localized upgrade node description as JSON string",
		});

		// Convert existing JSONB data to JSON strings (if any exist)
		await queryInterface.sequelize.query(`
			UPDATE upgradenodetemplates
			SET description = description::text
			WHERE description::text != description::text::jsonb::text;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Revert name column back to STRING
		await queryInterface.changeColumn("upgradenodetemplates", "name", {
			type: Sequelize.STRING,
		});

		// Revert description column back to JSONB
		await queryInterface.changeColumn("upgradenodetemplates", "description", {
			type: Sequelize.JSONB,
			defaultValue: {
				en: "",
				ru: "",
			},
			comment: "Localized upgrade node descriptions",
		});
	},
};
