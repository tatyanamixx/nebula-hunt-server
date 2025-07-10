'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('usereventsettings', {
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
			eventMultipliers: {
				type: Sequelize.JSONB,
				defaultValue: {
					production: 1.0,
					chaos: 1.0,
					stability: 1.0,
					entropy: 1.0,
					rewards: 1.0,
				},
				comment: 'Текущие активные множители от событий',
			},
			lastEventCheck: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				comment: 'Последнее время проверки событий',
			},
			eventCooldowns: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Кулдауны для разных типов событий',
			},
			enabledTypes: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
				comment: 'Включенные типы событий',
			},
			disabledEvents: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				comment: 'Отключенные конкретные события',
			},
			priorityEvents: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				comment: 'Приоритетные события',
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
		await queryInterface.addIndex('usereventsettings', ['userId'], {
			name: 'usereventsettings_user_id_idx',
			unique: true,
		});
		await queryInterface.addIndex('usereventsettings', ['lastEventCheck'], {
			name: 'usereventsettings_last_event_check_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('usereventsettings');
	},
};
