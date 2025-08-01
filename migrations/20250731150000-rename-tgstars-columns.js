'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Rename tgStars to stars
		await queryInterface.renameColumn('userstates', 'tgStars', 'stars');

		// Rename lockedTgStars to lockedStars
		await queryInterface.renameColumn(
			'userstates',
			'lockedTgStars',
			'lockedStars'
		);
	},

	async down(queryInterface, Sequelize) {
		// Revert stars back to tgStars
		await queryInterface.renameColumn('userstates', 'stars', 'tgStars');

		// Revert lockedStars back to lockedTgStars
		await queryInterface.renameColumn(
			'userstates',
			'lockedStars',
			'lockedTgStars'
		);
	},
};
