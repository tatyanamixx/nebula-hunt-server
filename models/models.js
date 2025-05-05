const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	tgId: { type: DataTypes.BIGINT },
	tgUserName: { type: DataTypes.STRING },
	role: { type: DataTypes.STRING, defaultValue: 'USER' },
});

const UserState = sequelize.define('userstate', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	amountToken: { type: DataTypes.INTEGER,defaultValue:0 },
	totalGalaxy: { type: DataTypes.INTEGER, defaultValue: 1 },
	totalStars: { type: DataTypes.INTEGER, defaultValue: 100 },
	totalTgStars: { type: DataTypes.INTEGER, defaultValue: 0 },
	rateFarm: { type: DataTypes.INTEGER, defaultValue: 100 },
	storageFarm: { type: DataTypes.INTEGER, defaultValue: 100 },
	intervalFarm: { type: DataTypes.INTEGER, defaultValue: 1 },
	autoBoost: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const Log = sequelize.define('log', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	operation: { type: DataTypes.STRING, allowNull: false },
	description: { type: DataTypes.STRING },
	amount: { type: DataTypes.INTEGER,defaultValue:0 },
});

const Token = sequelize.define('token', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	refreshToken: { type: DataTypes.STRING, allowNull: false },
});

const Galaxy = sequelize.define('galaxy', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	starsMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
	starsCurrent: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 100,
	},
	price: { type: DataTypes.INTEGER, defaultValue:0 },
	galaxySetting: { type: DataTypes.JSON },
});

User.hasOne(UserState);
Log.belongsTo(User);

User.hasOne(Token);
Log.belongsTo(User);

User.hasMany(Log);
Log.belongsTo(User);

User.hasMany(Galaxy);
Galaxy.belongsTo(User);

module.exports = {
	User,
	UserState,
	Token,
	Log,
	Galaxy,
};
