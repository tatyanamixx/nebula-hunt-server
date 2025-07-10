'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn('users', 'tonWallet', {
			type: Sequelize.STRING,
			allowNull: true,
			comment: 'TON wallet address of the user',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeColumn('users', 'tonWallet');
	},
};
