/**
 * Модели для работы с view связок template-ребенок
 *
 * Эти модели предоставляют удобный доступ к данным, объединяющим
 * таблицы шаблонов с таблицами пользовательских данных
 */

const sequelize = require('../db');
const { DataTypes } = require('sequelize');

// View для апгрейдов пользователя с данными шаблона
const UserUpgradeWithTemplate = sequelize.define(
	'UserUpgradeWithTemplate',
	{
		// Поля из userupgrades
		id: { type: DataTypes.BIGINT, primaryKey: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		upgradeNodeTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		level: { type: DataTypes.INTEGER, defaultValue: 0 },
		progress: { type: DataTypes.INTEGER, defaultValue: 0 },
		targetProgress: { type: DataTypes.INTEGER, defaultValue: 100 },
		completed: { type: DataTypes.BOOLEAN, defaultValue: false },
		progressHistory: { type: DataTypes.JSONB, defaultValue: [] },
		lastProgressUpdate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		createdAt: { type: DataTypes.DATE },
		updatedAt: { type: DataTypes.DATE },

		// Поля из upgradenodetemplates (с префиксом template)
		templateSlug: { type: DataTypes.STRING },
		templateName: { type: DataTypes.STRING },
		templateDescription: { type: DataTypes.JSONB },
		templateMaxLevel: { type: DataTypes.INTEGER },
		templateBasePrice: { type: DataTypes.INTEGER },
		templateEffectPerLevel: { type: DataTypes.FLOAT },
		templatePriceMultiplier: { type: DataTypes.FLOAT },
		templateCurrency: {
			type: DataTypes.ENUM('stardust', 'darkMatter', 'stars'),
		},
		templateCategory: {
			type: DataTypes.ENUM(
				'production',
				'economy',
				'special',
				'chance',
				'storage',
				'multiplier'
			),
		},
		templateIcon: { type: DataTypes.STRING(3) },
		templateStability: { type: DataTypes.FLOAT },
		templateInstability: { type: DataTypes.FLOAT },
		templateModifiers: { type: DataTypes.JSONB },
		templateConditions: { type: DataTypes.JSONB },
		templateChildren: { type: DataTypes.ARRAY(DataTypes.STRING) },
		templateWeight: { type: DataTypes.INTEGER },
		templateActive: { type: DataTypes.BOOLEAN },
		templateDelayedUntil: { type: DataTypes.DATE },
	},
	{
		tableName: 'user_upgrades_with_template',
		timestamps: false, // View не имеет автоматических timestamps
		freezeTableName: true,
	}
);

// View для задач пользователя с данными шаблона
const UserTaskWithTemplate = sequelize.define(
	'UserTaskWithTemplate',
	{
		// Поля из usertasks
		id: { type: DataTypes.BIGINT, primaryKey: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		taskTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		completed: { type: DataTypes.BOOLEAN, defaultValue: false },
		reward: {
			type: DataTypes.JSONB,
			defaultValue: { type: 'stardust', amount: 0 },
		},
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		completedAt: { type: DataTypes.DATE },
		createdAt: { type: DataTypes.DATE },
		updatedAt: { type: DataTypes.DATE },

		// Поля из tasktemplates (с префиксом template)
		templateSlug: { type: DataTypes.STRING },
		templateTitle: { type: DataTypes.JSONB },
		templateDescription: { type: DataTypes.JSONB },
		templateReward: { type: DataTypes.JSONB },
		templateCondition: { type: DataTypes.JSONB },
		templateIcon: { type: DataTypes.STRING },
		templateActive: { type: DataTypes.BOOLEAN },
	},
	{
		tableName: 'user_tasks_with_template',
		timestamps: false,
		freezeTableName: true,
	}
);

// View для событий пользователя с данными шаблона
const UserEventWithTemplate = sequelize.define(
	'UserEventWithTemplate',
	{
		// Поля из userevents
		id: { type: DataTypes.BIGINT, primaryKey: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		eventTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		status: {
			type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED'),
		},
		triggeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		expiresAt: { type: DataTypes.DATE },
		effects: { type: DataTypes.JSONB, defaultValue: {} },
		progress: { type: DataTypes.JSONB, defaultValue: {} },
		completedAt: { type: DataTypes.DATE },
		createdAt: { type: DataTypes.DATE },
		updatedAt: { type: DataTypes.DATE },

		// Поля из eventtemplates (с префиксом template)
		templateSlug: { type: DataTypes.STRING },
		templateName: { type: DataTypes.STRING },
		templateDescription: { type: DataTypes.JSONB },
		templateType: {
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
				'PASSIVE',
				'RESOURCE_BASED',
				'UPGRADE_DEPENDENT',
				'TASK_DEPENDENT',
				'MARKET_DEPENDENT',
				'MULTIPLAYER',
				'PROGRESSIVE',
				'TIERED'
			),
		},
		templateTriggerConfig: { type: DataTypes.JSONB },
		templateEffect: { type: DataTypes.JSONB },
		templateFrequency: { type: DataTypes.JSONB },
		templateConditions: { type: DataTypes.JSONB },
		templateActive: { type: DataTypes.BOOLEAN },
	},
	{
		tableName: 'user_events_with_template',
		timestamps: false,
		freezeTableName: true,
	}
);

// View для пакетов пользователя с данными шаблона
const UserPackageWithTemplate = sequelize.define(
	'UserPackageWithTemplate',
	{
		// Поля из packagestores
		id: { type: DataTypes.BIGINT, primaryKey: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		packageTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		amount: { type: DataTypes.INTEGER, allowNull: false },
		resource: { type: DataTypes.ENUM('stardust', 'darkMatter', 'stars') },
		price: { type: DataTypes.DECIMAL(30, 8), allowNull: false },
		currency: {
			type: DataTypes.ENUM(
				'tgStars',
				'tonToken',
				'stars',
				'stardust',
				'darkMatter'
			),
		},
		status: { type: DataTypes.BOOLEAN, defaultValue: true },
		isUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
		isLocked: { type: DataTypes.BOOLEAN, defaultValue: false },
		createdAt: { type: DataTypes.DATE },
		updatedAt: { type: DataTypes.DATE },

		// Поля из packagetemplates (с префиксом template)
		templateSlug: { type: DataTypes.STRING },
		templateName: { type: DataTypes.STRING },
		templateDescription: { type: DataTypes.TEXT },
		templateAmount: { type: DataTypes.INTEGER },
		templateResource: {
			type: DataTypes.ENUM('stardust', 'darkMatter', 'stars'),
		},
		templatePrice: { type: DataTypes.DECIMAL(30, 8) },
		templateCurrency: {
			type: DataTypes.ENUM(
				'tgStars',
				'tonToken',
				'stars',
				'stardust',
				'darkMatter'
			),
		},
		templateStatus: { type: DataTypes.BOOLEAN },
		templateImageUrl: { type: DataTypes.STRING },
		templateSortOrder: { type: DataTypes.INTEGER },
		templateCategory: { type: DataTypes.STRING },
		templateIsPromoted: { type: DataTypes.BOOLEAN },
		templateValidUntil: { type: DataTypes.DATE },
	},
	{
		tableName: 'user_packages_with_template',
		timestamps: false,
		freezeTableName: true,
	}
);

// View для артифактов пользователя с данными шаблона
const UserArtifactWithTemplate = sequelize.define(
	'UserArtifactWithTemplate',
	{
		// Поля из artifacts
		id: { type: DataTypes.BIGINT, primaryKey: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		artifactTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		seed: { type: DataTypes.STRING, unique: true },
		name: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT },
		tradable: { type: DataTypes.BOOLEAN, defaultValue: true },
		createdAt: { type: DataTypes.DATE },
		updatedAt: { type: DataTypes.DATE },

		// Поля из artifacttemplates (с префиксом template)
		templateSlug: { type: DataTypes.STRING },
		templateName: { type: DataTypes.STRING },
		templateDescription: { type: DataTypes.TEXT },
		templateRarity: {
			type: DataTypes.ENUM(
				'COMMON',
				'UNCOMMON',
				'RARE',
				'EPIC',
				'LEGENDARY'
			),
		},
		templateImage: { type: DataTypes.STRING },
		templateEffects: { type: DataTypes.JSONB },
		templateLimited: { type: DataTypes.BOOLEAN },
		templateLimitedCount: { type: DataTypes.INTEGER },
		templateLimitedDuration: { type: DataTypes.INTEGER },
		templateLimitedDurationType: {
			type: DataTypes.ENUM('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'),
		},
		templateLimitedDurationValue: { type: DataTypes.INTEGER },
	},
	{
		tableName: 'user_artifacts_with_template',
		timestamps: false,
		freezeTableName: true,
	}
);

module.exports = {
	UserUpgradeWithTemplate,
	UserTaskWithTemplate,
	UserEventWithTemplate,
	UserPackageWithTemplate,
	UserArtifactWithTemplate,
};
