'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('userstates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			state: {
				type: Sequelize.JSONB,
				defaultValue: {},
			},
			chaosLevel: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			stabilityLevel: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			entropyVelocity: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			taskProgress: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Tracks user progress in task network',
			},
			upgradeTree: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'User-specific upgrade tree structure and progress',
			},
			lastLoginDate: {
				type: Sequelize.DATEONLY,
				allowNull: true,
				comment: 'Date of the last login (YYYY-MM-DD)',
			},
			currentStreak: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				comment: 'Number of consecutive days logged in',
			},
			maxStreak: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				comment: 'Maximum streak achieved',
			},
			streakUpdatedAt: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Timestamp of the last streak update',
			},
			activeEvents: {
				type: Sequelize.JSONB,
				defaultValue: [],
				comment:
					'Currently active events for the user with their progress and effects',
			},
			eventMultipliers: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Current active multipliers from events',
			},
			lastEventCheck: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				comment: 'Last time events were checked and processed',
			},
			eventCooldowns: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Cooldown timestamps for different event types',
			},
			eventPreferences: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'User preferences for event types and specific events',
			},
			userTasks: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'User progress for each task',
			},
			completedTasks: {
				type: Sequelize.JSONB,
				defaultValue: [],
				comment:
					'Array of completed task IDs with completion timestamps',
			},
			activeTasks: {
				type: Sequelize.JSONB,
				defaultValue: [],
				comment: 'Array of active task IDs that user can work on',
			},
			taskMultipliers: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Current active multipliers from tasks',
			},
			lastTaskCheck: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				comment: 'Last time tasks were checked and updated',
			},
			userUpgrades: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'User progress for each upgrade node',
			},
			completedUpgrades: {
				type: Sequelize.JSONB,
				defaultValue: [],
				comment: 'Array of completed upgrade node IDs',
			},
			activeUpgrades: {
				type: Sequelize.JSONB,
				defaultValue: [],
				comment:
					'Array of active upgrade node IDs that user can purchase',
			},
			upgradeMultipliers: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Current active multipliers from upgrades',
			},
			lastUpgradeCheck: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				comment: 'Last time upgrades were checked and updated',
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
		await queryInterface.addIndex('userstates', ['userId'], {
			name: 'userstate_user_id_idx',
		});
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

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('userstates');
	},
};
