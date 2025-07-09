'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('tasks', {
			id: {
				type: Sequelize.STRING,
				primaryKey: true,
				allowNull: false,
			},
			title: {
				type: Sequelize.JSONB,
				allowNull: false,
			},
			description: {
				type: Sequelize.JSONB,
				allowNull: false,
			},
			reward: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			condition: {
				type: Sequelize.JSONB,
				allowNull: false,
			},
			icon: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('tasks');
	},
};
