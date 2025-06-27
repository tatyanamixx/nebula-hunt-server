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
			defaultValue: [],
			comment: 'History of user state with timestamps',
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

const UserUpgradeNode = sequelize.define(
	'userupgradenode',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		stability: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		instability: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		completed: { type: DataTypes.BOOLEAN, defaultValue: false },
		progress: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: 'Current progress value towards completion',
		},
		targetProgress: {
			type: DataTypes.INTEGER,
			defaultValue: 100,
			comment: 'Required progress value for completion',
		},
		progressHistory: {
			type: DataTypes.JSONB,
			defaultValue: [],
			comment: 'History of progress updates with timestamps',
		},
		lastProgressUpdate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			comment: 'Timestamp of the last progress update',
		},
	},
	{
		indexes: [
			{
				fields: ['userId'],
				name: 'userupgradenode_user_id_idx',
			},
		],
	}
);

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

const UserTask = sequelize.define(
	'usertask',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		taskId: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		progress: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		targetProgress: {
			type: DataTypes.INTEGER,
			defaultValue: 100,
		},
		completed: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		reward: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		progressHistory: {
			type: DataTypes.JSONB,
			defaultValue: [],
		},
		lastProgressUpdate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		indexes: [
			{
				unique: false,
				name: 'usertask_user_id_idx',
				fields: ['userId'],
			},
		],
	}
);

const UserEvent = sequelize.define(
	'userevent',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		status: {
			type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'COMPLETED'),
			defaultValue: 'ACTIVE',
		},
		progress: { type: DataTypes.JSONB, defaultValue: {} },
		priority: { type: DataTypes.INTEGER, defaultValue: 1 },
		triggeredAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},

		lastCheck: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			comment: 'Last time events were checked',
		},
		multipliers: {
			type: DataTypes.JSONB,
			defaultValue: { cps: 1.0 },
			comment: 'Current active multipliers from events',
		},
	},
	{
		indexes: [
			{
				fields: ['userId'],
				name: 'gameevent_user_id_idx',
			},
		],
	}
);

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
		type: DataTypes.ENUM('RANDOM', 'PERIODIC', 'ONE_TIME'),
		allowNull: false,
	},
	effect: {
		type: DataTypes.JSONB,
		allowNull: false,
		comment: 'Effect configuration (multiplier, duration, etc)',
	},
	frequency: {
		type: DataTypes.JSONB,
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

User.hasMany(UserUpgradeNode);
UserUpgradeNode.belongsTo(User);
UpgradeNode.hasMany(UserUpgradeNode);
UserUpgradeNode.belongsTo(UpgradeNode);

User.hasMany(UserTask);
UserTask.belongsTo(User);
Task.hasMany(UserTask);
UserTask.belongsTo(Task);

User.hasMany(UserEvent);
UserEvent.belongsTo(User);

GameEvent.hasMany(UserEvent);
UserEvent.belongsTo(GameEvent);

module.exports = {
	User,
	UserState,
	Token,
	Galaxy,
	UpgradeNode,
	UserUpgradeNode,
	Task,
	UserTask,
	GameEvent,
	UserEvent,
};
