"use strict";

module.exports = {
	async up(queryInterface, Sequelize) {
		// Устанавливаем значение по умолчанию для поля icon, если оно пустое
		await queryInterface.sequelize.query(`
			UPDATE tasktemplates 
			SET icon = '🎯' 
			WHERE icon IS NULL OR icon = '';
		`);

		// Изменяем поле icon, чтобы оно имело значение по умолчанию
		await queryInterface.changeColumn("tasktemplates", "icon", {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: "🎯",
			comment: "Icon for the task",
		});
	},

	async down(queryInterface, Sequelize) {
		// Возвращаем поле icon обратно к nullable
		await queryInterface.changeColumn("tasktemplates", "icon", {
			type: Sequelize.STRING,
			allowNull: true,
			comment: "Icon for the task",
		});
	},
};
