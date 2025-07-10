'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Добавляем поля для заблокированных ресурсов
		await queryInterface.addColumn('userstates', 'lockedStardust', {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0,
		});

		await queryInterface.addColumn('userstates', 'lockedDarkMatter', {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0,
		});

		await queryInterface.addColumn('userstates', 'lockedTgStars', {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0,
		});
	},

	async down(queryInterface, Sequelize) {
		// Удаляем добавленные поля
		await queryInterface.removeColumn('userstates', 'lockedStardust');
		await queryInterface.removeColumn('userstates', 'lockedDarkMatter');
		await queryInterface.removeColumn('userstates', 'lockedTgStars');
	},
};
