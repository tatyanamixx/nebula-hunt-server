const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define(
	'user',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, defaultValue: 0 },
		username: { type: DataTypes.STRING },
		referral: { type: DataTypes.BIGINT, defaultValue: 0 },
		role: {
			type: DataTypes.ENUM('USER', 'ADMIN'),
			defaultValue: 'USER',
		},
		blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
	},
	{
		indexes: [
			{
				fields: ['referral'],
				name: 'user_referral_idx',
			},
		],
	}
);

const UserState = sequelize.define(
	'userstate',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		state: {
			type: DataTypes.JSONB,
			defaultValue: {
				totalStars: 100,
				stardustCount: 0,
				darkMatterCount: 0,
				ownedGalaxiesCount: 1,
				ownedNodesCount: 0,
			},
		},
		chaosLevel: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		stabilityLevel: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		entropyVelocity: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		taskProgress: {
			type: DataTypes.JSONB,
			defaultValue: {
				completedTasks: [],
				currentWeight: 0,
				unlockedNodes: [],
			},
			comment: 'Tracks user progress in task network',
		},
		upgradeTree: {
			type: DataTypes.JSONB,
			defaultValue: {
				activeNodes: [],
				completedNodes: [],
				nodeStates: {},
				treeStructure: {},
				totalProgress: 0,
				lastNodeUpdate: DataTypes.DATE,
			},
			comment: 'User-specific upgrade tree structure and progress',
		},
		// Streak related fields
		lastLoginDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			comment: 'Date of the last login (YYYY-MM-DD)',
		},
		currentStreak: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: 'Number of consecutive days logged in',
		},
		maxStreak: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: 'Maximum streak achieved',
		},
		streakUpdatedAt: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: 'Timestamp of the last streak update',
		},
		stateHistory: {
			type: DataTypes.JSONB,
			defaultValue: {
				entries: [],
				lastUpdate: null,
				version: '1.0',
			},
			comment: `Detailed history of user state changes with structure:
{
  "entries": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "type": "state_change|task_completed|upgrade_purchased|event_triggered|login|milestone",
      "category": "production|economy|progress|achievement|system",
      "description": "Human readable description",
      "changes": {
        "field": "value",
        "oldValue": "previous_value",
        "newValue": "current_value"
      },
      "metadata": {
        "source": "manual|automatic|event|task|upgrade",
        "trigger": "user_action|system|event|condition",
        "relatedId": "task_id|upgrade_id|event_id"
      }
    }
  ],
  "lastUpdate": "2024-01-01T00:00:00Z",
  "version": "1.0"
}`,
		},
		// Event state fields
		activeEvents: {
			type: DataTypes.JSONB,
			defaultValue: [],
			comment:
				'Currently active events for the user with their progress and effects',
		},
		eventHistory: {
			type: DataTypes.JSONB,
			defaultValue: [],
			comment: 'History of completed and expired events with timestamps',
		},
		eventMultipliers: {
			type: DataTypes.JSONB,
			defaultValue: {
				production: 1.0,
				chaos: 1.0,
				stability: 1.0,
				entropy: 1.0,
				rewards: 1.0,
			},
			comment: 'Current active multipliers from events',
		},
		lastEventCheck: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			comment: 'Last time events were checked and processed',
		},
		eventCooldowns: {
			type: DataTypes.JSONB,
			defaultValue: {},
			comment: 'Cooldown timestamps for different event types',
		},
		eventPreferences: {
			type: DataTypes.JSONB,
			defaultValue: {
				enabledTypes: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
				disabledEvents: [],
				priorityEvents: [],
			},
			comment: 'User preferences for event types and specific events',
		},
		// Task state fields
		userTasks: {
			type: DataTypes.JSONB,
			defaultValue: {},
			comment:
				'User progress for each task: { taskId: { progress, targetProgress, completed, reward, progressHistory, lastProgressUpdate } }',
		},
		completedTasks: {
			type: DataTypes.JSONB,
			defaultValue: [],
			comment: 'Array of completed task IDs with completion timestamps',
		},
		activeTasks: {
			type: DataTypes.JSONB,
			defaultValue: [],
			comment: 'Array of active task IDs that user can work on',
		},
		taskMultipliers: {
			type: DataTypes.JSONB,
			defaultValue: {
				progress: 1.0,
				rewards: 1.0,
				unlock: 1.0,
			},
			comment: 'Current active multipliers from tasks',
		},
		lastTaskCheck: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			comment: 'Last time tasks were checked and updated',
		},
		// Upgrade state fields
		userUpgrades: {
			type: DataTypes.JSONB,
			defaultValue: {},
			comment:
				'User progress for each upgrade node: { nodeId: { level, progress, targetProgress, completed, stability, instability, progressHistory, lastProgressUpdate } }',
		},
		completedUpgrades: {
			type: DataTypes.JSONB,
			defaultValue: [],
			comment: 'Array of completed upgrade node IDs',
		},
		activeUpgrades: {
			type: DataTypes.JSONB,
			defaultValue: [],
			comment: 'Array of active upgrade node IDs that user can purchase',
		},
		upgradeTree: {
			type: DataTypes.JSONB,
			defaultValue: {
				activeNodes: [],
				completedNodes: [],
				nodeStates: {},
				treeStructure: {},
				totalProgress: 0,
				lastNodeUpdate: DataTypes.DATE,
			},
			comment: 'User-specific upgrade tree structure and progress',
		},
		upgradeMultipliers: {
			type: DataTypes.JSONB,
			defaultValue: {
				production: 1.0,
				efficiency: 1.0,
				cost: 1.0,
				unlock: 1.0,
			},
			comment: 'Current active multipliers from upgrades',
		},
		lastUpgradeCheck: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			comment: 'Last time upgrades were checked and updated',
		},
	},
	{
		indexes: [
			{
				fields: [sequelize.literal("((state->'totalStars')::integer)")],
				name: 'userstate_totalstars_idx',
			},
			{
				fields: ['userId'],
				name: 'userstate_user_id_idx',
			},
			{
				fields: ['lastEventCheck'],
				name: 'userstate_last_event_check_idx',
			},
			{
				fields: ['lastTaskCheck'],
				name: 'userstate_last_task_check_idx',
			},
			{
				fields: ['lastUpgradeCheck'],
				name: 'userstate_last_upgrade_check_idx',
			},
		],
	}
);

const Token = sequelize.define(
	'token',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		refreshToken: { type: DataTypes.STRING, allowNull: false },
	},
	{
		indexes: [
			{ fields: ['refreshToken'] },
			{
				fields: ['userId'],
				name: 'token_user_id_idx',
			},
		],
	}
);

const Galaxy = sequelize.define(
	'galaxy',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		starMin: { type: DataTypes.INTEGER, defaultValue: 100 },
		starCurrent: { type: DataTypes.INTEGER, defaultValue: 100 },
		price: { type: DataTypes.INTEGER, defaultValue: 100 },
		seed: { type: DataTypes.STRING, unique: true },
		particleCount: { type: DataTypes.INTEGER, defaultValue: 100 },
		onParticleCountChange: { type: DataTypes.BOOLEAN, defaultValue: true },
		galaxyProperties: { type: DataTypes.JSONB },
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
	},
	{
		indexes: [
			{
				fields: ['seed'],
				name: 'galaxy_seed_idx',
			},
			{
				fields: ['userId'],
				name: 'galaxy_user_id_idx',
			},
		],
	}
);

const UpgradeNode = sequelize.define('upgradenode', {
	id: { type: DataTypes.STRING(50), primaryKey: true, unique: true },
	name: { type: DataTypes.STRING },
	description: {
		type: DataTypes.JSONB,
		defaultValue: {
			en: '',
			ru: '',
		},
		comment: 'Localized upgrade node descriptions',
	},
	maxLevel: { type: DataTypes.INTEGER, defaultValue: 0 },
	basePrice: { type: DataTypes.INTEGER, defaultValue: 0 },
	effectPerLevel: { type: DataTypes.FLOAT, defaultValue: 0 },
	priceMultiplier: { type: DataTypes.FLOAT, defaultValue: 1.0 },
	currency: {
		type: DataTypes.ENUM('stardust', 'darkmetter'),
		defaultValue: 'stardust',
	},
	category: {
		type: DataTypes.ENUM(
			'production',
			'economy',
			'special',
			'chance',
			'storage',
			'multiplier'
		),
		defaultValue: 'production',
	},
	icon: { type: DataTypes.STRING(3), defaultValue: '' },
	stability: { type: DataTypes.FLOAT, defaultValue: 0.0 },
	instability: { type: DataTypes.FLOAT, defaultValue: 0.0 },
	modifiers: {
		type: DataTypes.JSONB,
		defaultValue: {},
		comment: 'Additional modifiers and effects of the upgrade',
	},
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
	conditions: {
		type: DataTypes.JSONB,
		defaultValue: {},
		comment: 'Conditions required to unlock or purchase the upgrade',
	},
	delayedUntil: {
		type: DataTypes.DATE,
		allowNull: true,
		comment: 'Timestamp until which the upgrade is delayed',
	},
	children: {
		type: DataTypes.ARRAY(DataTypes.STRING),
		defaultValue: [],
		comment: 'Array of node names that are unlocked by this upgrade',
	},
	weight: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
		comment: 'Weight/difficulty of the upgrade node',
	},
});

const Task = sequelize.define('task', {
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	title: {
		type: DataTypes.JSONB,
		allowNull: false,
		comment: 'Localized task descriptions',
	},
	description: {
		type: DataTypes.JSONB,
		allowNull: false,
	},
	reward: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	condition: {
		type: DataTypes.JSONB,
		allowNull: false,
		comment: 'Condition for the task to be completed',
	},
	icon: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
	},
});

const GameEvent = sequelize.define('gameevent', {
	id: { type: DataTypes.STRING(20), primaryKey: true, unique: true },
	name: { type: DataTypes.STRING, allowNull: false },
	description: {
		type: DataTypes.JSONB,
		defaultValue: {
			en: '',
			ru: '',
		},
		comment: 'Localized event descriptions',
	},
	type: {
		type: DataTypes.ENUM(
			'RANDOM',
			'PERIODIC',
			'ONE_TIME',
			'CONDITIONAL',
			'CHAINED',
			'TRIGGERED_BY_ACTION',
			'GLOBAL_TIMED',
			'LIMITED_REPEATABLE',
			'SEASONAL',
			'PASSIVE'
		),
		allowNull: false,
	},
	triggerConfig: {
		type: DataTypes.JSONB,
		defaultValue: {},
		comment: `Dynamic trigger logic depending on type:
- PERIODIC: { interval: '1h' }
- RANDOM: { chancePerHour: 0.1 }
- CONDITIONAL: { condition: { metric: 'chaosLevel', op: '>', value: 50 } }
- CHAINED: { after: 'eventId' }
- TRIGGERED_BY_ACTION: { action: 'burn-core' }
- SEASONAL: { start: '2025-06-01', end: '2025-06-30' }
- GLOBAL_TIMED: { at: '2025-07-01T00:00:00Z' }`,
	},
	effect: {
		type: DataTypes.JSONB,
		allowNull: false,
		comment: 'Effect configuration (multiplier, duration, etc)',
	},
	frequency: {
		type: DataTypes.JSONB,
		defaultValue: {},
		comment: 'Frequency settings for RANDOM and PERIODIC events',
	},
	conditions: {
		type: DataTypes.JSONB,
		defaultValue: {},
		comment: 'Conditions that must be met for the event to trigger',
	},
	active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
	},
});

User.hasOne(UserState);
UserState.belongsTo(User);

User.hasOne(Token);
Token.belongsTo(User);

User.hasMany(Galaxy);
Galaxy.belongsTo(User);

module.exports = {
	User,
	UserState,
	Token,
	Galaxy,
	UpgradeNode,
	Task,
	GameEvent,
};
