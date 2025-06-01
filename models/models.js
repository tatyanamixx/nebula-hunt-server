const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define(
	'user',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		tmaId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
		tmaUsername: { type: DataTypes.STRING },
		referral: { type: DataTypes.BIGINT },
		role: {
			type: DataTypes.ENUM('USER', 'ADMIN', 'VERSE'),
			defaultValue: 'USER',
		},
		blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
	},
	{ indexes: [{ unique: true, fields: ['tmaId'] }, { fields: ['referral'] }] }
);

const UserState = sequelize.define(
	'userstate',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		//stars: { type: DataTypes.INTEGER, defaultValue: 0 },
		state: {
			type: DataTypes.JSONB,
			defaultValue: {
				totalStars: 100,
				stardustCount: 0,
				darkMatterCount: 0,
				ownedGalaxiesCount: 1,
			},
		},
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
				lastNodeUpdate: null,
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
	},
	{
		indexes: [
			{
				fields: [sequelize.literal("((state->'totalStars')::integer)")],
				name: 'userstate_totalstars_idx',
			},
		],
	}
);

const Log = sequelize.define('log', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	operation: {
		type: DataTypes.ENUM(
			'REGISTRATION',
			'LOGIN',
			'REFRESH',
			'UPDATE',
			'GET'
		),
		allowNull: false,
	},
	description: { type: DataTypes.STRING },
	amount: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const Token = sequelize.define(
	'token',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		refreshToken: { type: DataTypes.STRING, allowNull: false },
	},
	{ indexes: [{ fields: ['refreshToken'] }] }
);

const Galaxy = sequelize.define('galaxy', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	starMin: { type: DataTypes.INTEGER, defaultValue: 100 },
	starCurrent: { type: DataTypes.INTEGER, defaultValue: 100 },
	price: { type: DataTypes.INTEGER, defaultValue: 100 },
	galaxySetting: { type: DataTypes.JSONB },
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

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

const UserUpgradeNode = sequelize.define('userupgradenode', {
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
});

const Achievement = sequelize.define('achievement', {
	id: { type: DataTypes.STRING(50), primaryKey: true, unique: true },
	title: { type: DataTypes.STRING },
	description: {
		type: DataTypes.JSONB,
		defaultValue: {
			en: '',
			ru: '',
		},
		comment: 'Localized achievement descriptions',
	},
	reward: {
		type: DataTypes.JSONB,
		defaultValue: [{ type: 'stardust', amount: 0 }],
		comment: 'Array of configurations with type and amount values',
	},
	condition: {
		type: DataTypes.STRING,
		defaultValue: '',
		comment: 'Condition for the achievement to be completed',
	},
	icon: { type: DataTypes.STRING(3), defaultValue: '' },
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const UserAchievement = sequelize.define('userachievement', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
	completed: { type: DataTypes.BOOLEAN, defaultValue: false },
	progress: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		comment: 'Current progress value towards completion',
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
});

const UserEventState = sequelize.define('usereventstate', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	activeEvents: {
		type: DataTypes.JSONB,
		defaultValue: [],
		comment: 'Currently active events for the user',
	},
	eventHistory: {
		type: DataTypes.JSONB,
		defaultValue: [],
		comment: 'History of triggered events',
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
});

const UserEvent = sequelize.define('userevent', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	status: {
		type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'COMPLETED'),
		defaultValue: 'ACTIVE',
	},
	triggeredAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
	expiresAt: {
		type: DataTypes.DATE,
		allowNull: true,
	},
	effectValue: {
		type: DataTypes.FLOAT,
		defaultValue: 1.0,
		comment: 'Current value of the effect (e.g. multiplier value)',
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

User.hasMany(Log);
Log.belongsTo(User);

User.hasMany(Galaxy);
Galaxy.belongsTo(User);

User.hasMany(UserUpgradeNode);
UserUpgradeNode.belongsTo(User);
UpgradeNode.hasMany(UserUpgradeNode);
UserUpgradeNode.belongsTo(UpgradeNode);

User.hasMany(UserAchievement);
UserAchievement.belongsTo(User);
Achievement.hasMany(UserAchievement);
UserAchievement.belongsTo(Achievement);

User.hasMany(UserEventState);
UserEventState.belongsTo(User);

UserEventState.hasMany(UserEvent);
UserEvent.belongsTo(UserEventState);

User.hasMany(UserEvent);
UserEvent.belongsTo(User);

GameEvent.hasMany(UserEvent);
UserEvent.belongsTo(GameEvent);

module.exports = {
	User,
	UserState,
	Token,
	Log,
	Galaxy,
	UpgradeNode,
	UserUpgradeNode,
	Achievement,
	UserAchievement,
	GameEvent,
	UserEventState,
	UserEvent,
};
