'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('usertasks', {
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
			taskId: {
				type: Sequelize.STRING,
				allowNull: false,
				references: {
					model: 'tasks',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
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
			reward: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			progressHistory: {
				type: Sequelize.JSONB,
				defaultValue: [],
			},
			lastProgressUpdate: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			completedAt: {
				type: Sequelize.DATE,
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

		// Создаем индексы для быстрого поиска
		await queryInterface.addIndex('usertasks', ['userId'], {
			name: 'usertasks_user_id_idx',
		});
		await queryInterface.addIndex('usertasks', ['taskId'], {
			name: 'usertasks_task_id_idx',
		});
		await queryInterface.addIndex('usertasks', ['userId', 'taskId'], {
			name: 'usertasks_user_task_idx',
			unique: true,
		});
		await queryInterface.addIndex('usertasks', ['completed'], {
			name: 'usertasks_completed_idx',
		});
		await queryInterface.addIndex('usertasks', ['active'], {
			name: 'usertasks_active_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('usertasks');
	},
};
