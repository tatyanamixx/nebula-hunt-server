'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('tokens', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			refreshToken: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: true,
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
		await queryInterface.addIndex('tokens', ['refreshToken']);
		await queryInterface.addIndex('tokens', ['userId'], {
			name: 'token_user_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('tokens');
	},
};
