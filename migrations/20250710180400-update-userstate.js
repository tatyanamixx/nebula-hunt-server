'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Удаляем поля, которые теперь будут храниться в отдельных таблицах
		await queryInterface.removeColumn('userstates', 'userUpgrades');
		await queryInterface.removeColumn('userstates', 'completedUpgrades');
		await queryInterface.removeColumn('userstates', 'activeUpgrades');
		await queryInterface.removeColumn('userstates', 'upgradeMultipliers');
		await queryInterface.removeColumn('userstates', 'lastUpgradeCheck');

		await queryInterface.removeColumn('userstates', 'userTasks');
		await queryInterface.removeColumn('userstates', 'completedTasks');
		await queryInterface.removeColumn('userstates', 'activeTasks');
		await queryInterface.removeColumn('userstates', 'taskMultipliers');
		await queryInterface.removeColumn('userstates', 'lastTaskCheck');

		await queryInterface.removeColumn('userstates', 'activeEvents');
		await queryInterface.removeColumn('userstates', 'eventMultipliers');
		await queryInterface.removeColumn('userstates', 'lastEventCheck');
		await queryInterface.removeColumn('userstates', 'eventCooldowns');
		await queryInterface.removeColumn('userstates', 'eventPreferences');

		// Удаляем индексы, которые больше не нужны
		await queryInterface.removeIndex(
			'userstates',
			'userstate_last_event_check_idx'
		);
		await queryInterface.removeIndex(
			'userstates',
			'userstate_last_task_check_idx'
		);
		await queryInterface.removeIndex(
			'userstates',
			'userstate_last_upgrade_check_idx'
		);
	},

	async down(queryInterface, Sequelize) {
		// Возвращаем удаленные поля
		await queryInterface.addColumn('userstates', 'userUpgrades', {
			type: Sequelize.JSONB,
			defaultValue: {},
			comment: 'User progress for each upgrade node',
		});

		await queryInterface.addColumn('userstates', 'completedUpgrades', {
			type: Sequelize.JSONB,
			defaultValue: [],
			comment: 'Array of completed upgrade node IDs',
		});

		await queryInterface.addColumn('userstates', 'activeUpgrades', {
			type: Sequelize.JSONB,
			defaultValue: [],
			comment: 'Array of active upgrade node IDs that user can purchase',
		});

		await queryInterface.addColumn('userstates', 'upgradeMultipliers', {
			type: Sequelize.JSONB,
			defaultValue: {
				production: 1.0,
				efficiency: 1.0,
				cost: 1.0,
				unlock: 1.0,
			},
			comment: 'Current active multipliers from upgrades',
		});

		await queryInterface.addColumn('userstates', 'lastUpgradeCheck', {
			type: Sequelize.DATE,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			comment: 'Last time upgrades were checked and updated',
		});

		await queryInterface.addColumn('userstates', 'userTasks', {
			type: Sequelize.JSONB,
			defaultValue: {},
			comment: 'User progress for each task',
		});

		await queryInterface.addColumn('userstates', 'completedTasks', {
			type: Sequelize.JSONB,
			defaultValue: [],
			comment: 'Array of completed task IDs with completion timestamps',
		});

		await queryInterface.addColumn('userstates', 'activeTasks', {
			type: Sequelize.JSONB,
			defaultValue: [],
			comment: 'Array of active task IDs that user can work on',
		});

		await queryInterface.addColumn('userstates', 'taskMultipliers', {
			type: Sequelize.JSONB,
			defaultValue: {
				progress: 1.0,
				rewards: 1.0,
				unlock: 1.0,
			},
			comment: 'Current active multipliers from tasks',
		});

		await queryInterface.addColumn('userstates', 'lastTaskCheck', {
			type: Sequelize.DATE,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			comment: 'Last time tasks were checked and updated',
		});

		await queryInterface.addColumn('userstates', 'activeEvents', {
			type: Sequelize.JSONB,
			defaultValue: [],
			comment:
				'Currently active events for the user with their progress and effects',
		});

		await queryInterface.addColumn('userstates', 'eventMultipliers', {
			type: Sequelize.JSONB,
			defaultValue: {
				production: 1.0,
				chaos: 1.0,
				stability: 1.0,
				entropy: 1.0,
				rewards: 1.0,
			},
			comment: 'Current active multipliers from events',
		});

		await queryInterface.addColumn('userstates', 'lastEventCheck', {
			type: Sequelize.DATE,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			comment: 'Last time events were checked and processed',
		});

		await queryInterface.addColumn('userstates', 'eventCooldowns', {
			type: Sequelize.JSONB,
			defaultValue: {},
			comment: 'Cooldown timestamps for different event types',
		});

		await queryInterface.addColumn('userstates', 'eventPreferences', {
			type: Sequelize.JSONB,
			defaultValue: {
				enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
				disabledEvents: [],
				priorityEvents: [],
			},
			comment: 'User preferences for event types and specific events',
		});

		// Восстанавливаем индексы
		await queryInterface.addIndex('userstates', ['lastEventCheck'], {
			name: 'userstate_last_event_check_idx',
		});
		await queryInterface.addIndex('userstates', ['lastTaskCheck'], {
			name: 'userstate_last_task_check_idx',
		});
		await queryInterface.addIndex('userstates', ['lastUpgradeCheck'], {
			name: 'userstate_last_upgrade_check_idx',
		});
	},
};
