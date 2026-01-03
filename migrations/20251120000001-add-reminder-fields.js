"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Add language field to users table
		await queryInterface.addColumn("users", "language", {
			type: Sequelize.STRING(10),
			allowNull: true,
			defaultValue: "en",
			comment: "User's preferred language (en, ru, etc.)",
		});

		// Add lastReminderSentAt field to users table
		await queryInterface.addColumn("users", "lastReminderSentAt", {
			type: Sequelize.DATE,
			allowNull: true,
			comment: "Timestamp of the last reminder notification sent to user",
		});

		// Add reminderEnabled field (user can disable reminders)
		await queryInterface.addColumn("users", "reminderEnabled", {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: true,
			comment: "Whether user wants to receive reminder notifications",
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeColumn("users", "language");
		await queryInterface.removeColumn("users", "lastReminderSentAt");
		await queryInterface.removeColumn("users", "reminderEnabled");
	},
};
