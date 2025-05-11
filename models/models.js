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
	operation: { type: DataTypes.STRING, allowNull: false },
	description: { type: DataTypes.STRING },
	amount: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const Token = sequelize.define('token', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	refreshToken: { type: DataTypes.STRING, allowNull: false },
});

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
