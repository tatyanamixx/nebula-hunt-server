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
});

const Task = sequelize.define('task', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	keyWord: { type: DataTypes.STRING },
	description: { type: DataTypes.STRING },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
	active: { type: DataTypes.BOOLEAN, defaultValue: true },
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
	from: { type: DataTypes.INTEGER, defaultValue: 0 },
	to: { type: DataTypes.INTEGER, defaultValue: 0 },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const UserAchievement = sequelize.define('userachievement', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	reward: { type: DataTypes.INTEGER, defaultValue: 0 },
	completed: { type: DataTypes.BOOLEAN, defaultValue: false },
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

module.exports = {
	User,
	UserState,
	Token,
	Log,
	Galaxy,
	Task,
	UserTask,
	Achievement,
	UserAchievement,
};
