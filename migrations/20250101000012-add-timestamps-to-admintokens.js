'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Add createdAt and updatedAt columns to admintokens table
		await queryInterface.addColumn('admintokens', 'createdAt', {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
		});

		await queryInterface.addColumn('admintokens', 'updatedAt', {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
		});
	},

	async down(queryInterface, Sequelize) {
		// Remove the columns
		await queryInterface.removeColumn('admintokens', 'createdAt');
		await queryInterface.removeColumn('admintokens', 'updatedAt');
	},
};
