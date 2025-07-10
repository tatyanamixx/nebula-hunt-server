'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('userevents', {
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
			eventId: {
				type: Sequelize.STRING(20),
				allowNull: false,
				references: {
					model: 'gameevents',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			status: {
				type: Sequelize.ENUM(
					'ACTIVE',
					'EXPIRED',
					'COMPLETED',
					'CANCELLED'
				),
				defaultValue: 'ACTIVE',
			},
			triggeredAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			effects: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Эффекты события (множители и т.д.)',
			},
			progress: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Прогресс выполнения события',
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
		await queryInterface.addIndex('userevents', ['userId'], {
			name: 'userevents_user_id_idx',
		});
		await queryInterface.addIndex('userevents', ['eventId'], {
			name: 'userevents_event_id_idx',
		});
		await queryInterface.addIndex('userevents', ['status'], {
			name: 'userevents_status_idx',
		});
		await queryInterface.addIndex('userevents', ['expiresAt'], {
			name: 'userevents_expires_at_idx',
		});
		await queryInterface.addIndex('userevents', ['triggeredAt'], {
			name: 'userevents_triggered_at_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('userevents');
	},
};
