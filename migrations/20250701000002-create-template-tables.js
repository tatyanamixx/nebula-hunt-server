'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create TaskTemplate table
		await queryInterface.createTable('tasktemplates', {
			id: {
				type: Sequelize.STRING,
				primaryKey: true,
			},
			title: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: 'Localized task descriptions',
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
				comment: 'Condition for the task to be completed',
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
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create EventTemplate table
		await queryInterface.createTable('eventtemplates', {
			id: {
				type: Sequelize.STRING(20),
				primaryKey: true,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.JSONB,
				defaultValue: {
					en: '',
					ru: '',
				},
				comment: 'Localized event descriptions',
			},
			type: {
				type: Sequelize.ENUM(
					'RANDOM',
					'PERIODIC',
					'ONE_TIME',
					'CONDITIONAL',
					'CHAINED',
					'TRIGGERED_BY_ACTION',
					'GLOBAL_TIMED',
					'LIMITED_REPEATABLE',
					'SEASONAL',
					'PASSIVE',
					'RESOURCE_BASED',
					'UPGRADE_DEPENDENT',
					'TASK_DEPENDENT',
					'MARKET_DEPENDENT',
					'MULTIPLAYER',
					'PROGRESSIVE',
					'TIERED'
				),
				allowNull: false,
			},
			triggerConfig: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Dynamic trigger logic depending on type',
			},
			effect: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: 'Effect configuration (multiplier, duration, etc)',
			},
			frequency: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Frequency settings for RANDOM and PERIODIC events',
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Conditions that must be met for the event to trigger',
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserUpgrade table
		await queryInterface.createTable('userupgrades', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
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
				defaultValue: Sequelize.NOW,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserTask table
		await queryInterface.createTable('usertasks', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
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
					model: 'tasktemplates',
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
				defaultValue: Sequelize.NOW,
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
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserEvent table
		await queryInterface.createTable('userevents', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
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
					model: 'eventtemplates',
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
				defaultValue: Sequelize.NOW,
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
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserEventSetting table
		await queryInterface.createTable('usereventsettings', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				unique: true,
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
				defaultValue: Sequelize.NOW,
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
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create indexes
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

		await queryInterface.addIndex('usereventsettings', ['userId'], {
			name: 'usereventsettings_user_id_idx',
			unique: true,
		});
		await queryInterface.addIndex('usereventsettings', ['lastEventCheck'], {
			name: 'usereventsettings_last_event_check_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable('usereventsettings');
		await queryInterface.dropTable('userevents');
		await queryInterface.dropTable('usertasks');
		await queryInterface.dropTable('userupgrades');
		await queryInterface.dropTable('eventtemplates');
		await queryInterface.dropTable('tasktemplates');
	},
};
