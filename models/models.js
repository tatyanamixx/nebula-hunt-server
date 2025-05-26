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
		stars: { type: DataTypes.INTEGER, defaultValue: 0 },
		state: { type: DataTypes.JSONB },
		taskProgress: {
			type: DataTypes.JSONB,
			defaultValue: {
				completedTasks: [],
				currentWeight: 0,
				unlockedNodes: [],
			},
			comment: 'Tracks user progress in task network',
		},
	},
	{ indexes: [{ fields: ['stars'] }] }
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
	owner: {
		type: DataTypes.ENUM('USER', 'ADMIN', 'VERSE'),
		defaultValue: 'VERSE',
	},
	stars: { type: DataTypes.INTEGER, defaultValue: 100 },
	galaxyData: { type: DataTypes.JSONB },
	galaxySetting: { type: DataTypes.JSON },
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Task = sequelize.define('task', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	keyWord: { type: DataTypes.STRING },
	description: { type: DataTypes.STRING },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
	conditions: {
		type: DataTypes.JSONB,
		defaultValue: {},
		comment: 'Conditions that must be met to unlock this task',
	},
	weight: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
		comment: 'Weight/difficulty of the task',
	},
});

const UserTask = sequelize.define('usertask', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
	completed: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const Achievement = sequelize.define('achievement', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	keyWord: { type: DataTypes.STRING },
	description: { type: DataTypes.STRING },
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
});
const AchievementReward = sequelize.define('achievementreward', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	level: { type: DataTypes.INTEGER, defaultValue: 0 },
	from: { type: DataTypes.INTEGER, defaultValue: 0 },
	to: { type: DataTypes.INTEGER, defaultValue: 0 },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const UserAchievement = sequelize.define('userachievement', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	level: { type: DataTypes.INTEGER, defaultValue: 0 },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
	completed: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const TaskConnection = sequelize.define('taskconnection', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	fromTaskId: {
		type: DataTypes.BIGINT,
		allowNull: false,
		references: {
			model: 'tasks',
			key: 'id',
		},
	},
	toTaskId: {
		type: DataTypes.BIGINT,
		allowNull: false,
		references: {
			model: 'tasks',
			key: 'id',
		},
	},
	requiredWeight: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		comment: 'Minimum weight required to unlock this connection',
	},
});

const GameEvent = sequelize.define('gameevent', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	name: { type: DataTypes.STRING, allowNull: false },
	description: { type: DataTypes.STRING },
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

User.hasOne(UserState);
UserState.belongsTo(User);

User.hasOne(Token);
Token.belongsTo(User);

User.hasMany(Log);
Log.belongsTo(User);

User.hasMany(Galaxy);
Galaxy.belongsTo(User);

User.hasMany(UserTask);
UserTask.belongsTo(User);

User.hasMany(UserAchievement);
UserAchievement.belongsTo(User);

Task.hasMany(UserTask);
UserTask.belongsTo(Task);

Achievement.hasMany(UserAchievement);
UserAchievement.belongsTo(Achievement);

Achievement.hasMany(AchievementReward);
AchievementReward.belongsTo(Achievement);

Task.hasMany(TaskConnection, {
	as: 'outgoingConnections',
	foreignKey: 'fromTaskId',
});
Task.hasMany(TaskConnection, {
	as: 'incomingConnections',
	foreignKey: 'toTaskId',
});
TaskConnection.belongsTo(Task, { as: 'fromTask', foreignKey: 'fromTaskId' });
TaskConnection.belongsTo(Task, { as: 'toTask', foreignKey: 'toTaskId' });

User.hasOne(UserEventState);
UserEventState.belongsTo(User);

module.exports = {
	User,
	UserState,
	Token,
	Log,
	Galaxy,
	Task,
	TaskConnection,
	UserTask,
	Achievement,
	AchievementReward,
	UserAchievement,
	GameEvent,
	UserEventState,
};
