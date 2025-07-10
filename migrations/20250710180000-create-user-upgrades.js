'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('userupgrades', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			nodeId: {
				type: Sequelize.STRING(50),
				allowNull: false,
				references: {
					model: 'upgradenodes',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			level: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			progress: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			targetProgress: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			completed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			stability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			instability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			progressHistory: {
				type: Sequelize.JSONB,
				defaultValue: [],
			},
			lastProgressUpdate: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

		// Создаем индексы для быстрого поиска
		await queryInterface.addIndex('userupgrades', ['userId'], {
			name: 'userupgrades_user_id_idx',
		});
		await queryInterface.addIndex('userupgrades', ['nodeId'], {
			name: 'userupgrades_node_id_idx',
		});
		await queryInterface.addIndex('userupgrades', ['userId', 'nodeId'], {
			name: 'userupgrades_user_node_idx',
			unique: true,
		});
		await queryInterface.addIndex('userupgrades', ['completed'], {
			name: 'userupgrades_completed_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('userupgrades');
	},
};
