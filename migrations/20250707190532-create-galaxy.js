'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('galaxies', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			starMin: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			starCurrent: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			price: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
			},
			particleCount: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			onParticleCountChange: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			galaxyProperties: {
				type: Sequelize.JSONB,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
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
		await queryInterface.addIndex('galaxies', ['seed'], {
			name: 'galaxy_seed_idx',
			unique: true,
		});
		await queryInterface.addIndex('galaxies', ['userId'], {
			name: 'galaxy_user_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('galaxies');
	},
};
