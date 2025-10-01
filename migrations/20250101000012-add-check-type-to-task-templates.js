"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Добавляем поле checkType в таблицу tasktemplates
		await queryInterface.addColumn("tasktemplates", "checkType", {
			type: Sequelize.STRING,
			defaultValue: "stardust_count",
			allowNull: false,
			comment:
				"Type of condition check: stardust_count, dark_matter_count, stars_count, galaxies_count, scans_count, streak_count, daily_reset, galaxy_upgraded, galaxy_shared",
		});
	},

	async down(queryInterface, Sequelize) {
		// Удаляем поле checkType
		await queryInterface.removeColumn("tasktemplates", "checkType");
	},
};
