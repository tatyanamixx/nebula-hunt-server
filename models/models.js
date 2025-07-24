/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 */
const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define(
	'user',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true },
		username: { type: DataTypes.STRING },
		referral: { type: DataTypes.BIGINT, defaultValue: 0 },
		role: {
			type: DataTypes.ENUM('USER', 'SYSTEM'),
			defaultValue: 'USER',
		},

		blocked: { type: DataTypes.BOOLEAN, defaultValue: false },

		tonWallet: {
			type: DataTypes.STRING,
			allowNull: true,
			comment: 'TON wallet address of the user',
		},
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
		userId: { type: DataTypes.BIGINT, unique: true, allowNull: false },
		stardust: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		darkMatter: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		stars: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		tgStars: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
		tonToken: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
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
		chaosLevel: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		stabilityLevel: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		entropyVelocity: { type: DataTypes.FLOAT, defaultValue: 0.0 },
		lastDailyBonus: { type: DataTypes.DATE, allowNull: true },
		lockedStardust: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
		},
		lockedDarkMatter: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
		},
		lockedStars: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
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
				fields: ['userId'],
				name: 'userstate_user_id_idx',
			},
		],
	}
);

// Новая модель для пользовательских апгрейдов
const UserUpgrade = sequelize.define(
	'userupgrade',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		upgradeNodeTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		level: { type: DataTypes.INTEGER, defaultValue: 0 },
		progress: { type: DataTypes.INTEGER, defaultValue: 0 },
		targetProgress: { type: DataTypes.INTEGER, defaultValue: 100 },
		completed: { type: DataTypes.BOOLEAN, defaultValue: false },
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
				fields: ['userId'],
				name: 'userupgrades_user_id_idx',
			},
			{
				fields: ['upgradeNodeTemplateId'],
				name: 'userupgrades_upgrade_node_id_idx',
			},
			{
				fields: ['completed'],
				name: 'userupgrades_completed_idx',
			},
		],
	}
);

// Новая модель для пользовательских задач
const UserTask = sequelize.define(
	'usertask',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		taskTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		progress: { type: DataTypes.INTEGER, defaultValue: 0 },
		targetProgress: { type: DataTypes.INTEGER, defaultValue: 100 },
		completed: { type: DataTypes.BOOLEAN, defaultValue: false },
		reward: {
			type: DataTypes.JSONB,
			defaultValue: { type: 'stardust', amount: 0 },
		},
		progressHistory: {
			type: DataTypes.JSONB,
			defaultValue: [],
		},
		lastProgressUpdate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		active: { type: DataTypes.BOOLEAN, defaultValue: true },
		completedAt: { type: DataTypes.DATE, allowNull: true },
	},
	{
		indexes: [
			{
				fields: ['userId'],
				name: 'usertasks_user_id_idx',
			},
			{
				fields: ['taskTemplateId'],
				name: 'usertasks_task_template_id_idx',
			},

			{
				fields: ['completed'],
				name: 'usertasks_completed_idx',
			},
			{
				fields: ['active'],
				name: 'usertasks_active_idx',
			},
		],
	}
);

// Новая модель для пользовательских событий
const UserEvent = sequelize.define(
	'userevent',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		eventTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		status: {
			type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED'),
			defaultValue: 'ACTIVE',
		},
		triggeredAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		expiresAt: { type: DataTypes.DATE, allowNull: true },
		effects: {
			type: DataTypes.JSONB,
			defaultValue: {},
			comment: 'Эффекты события (множители и т.д.)',
		},
		progress: {
			type: DataTypes.JSONB,
			defaultValue: {},
			comment: 'Прогресс выполнения события',
		},
		completedAt: { type: DataTypes.DATE, allowNull: true },
	},
	{
		indexes: [
			{
				fields: ['userId'],
				name: 'userevents_user_id_idx',
			},
			{
				fields: ['eventTemplateId'],
				name: 'userevents_event_template_id_idx',
			},
			{
				fields: ['status'],
				name: 'userevents_status_idx',
			},
			{
				fields: ['expiresAt'],
				name: 'userevents_expires_at_idx',
			},
			{
				fields: ['triggeredAt'],
				name: 'userevents_triggered_at_idx',
			},
		],
	}
);

// Новая модель для настроек пользовательских событий
const UserEventSetting = sequelize.define(
	'usereventsetting',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		eventMultipliers: {
			type: DataTypes.JSONB,
			defaultValue: {
				production: 1.0,
				chaos: 1.0,
				stability: 1.0,
				entropy: 1.0,
				rewards: 1.0,
			},
			comment: 'Текущие активные множители от событий',
		},
		lastEventCheck: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			comment: 'Последнее время проверки событий',
		},
		eventCooldowns: {
			type: DataTypes.JSONB,
			defaultValue: {},
			comment: 'Кулдауны для разных типов событий',
		},
		enabledTypes: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
			comment: 'Включенные типы событий',
		},
		disabledEvents: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: [],
			comment: 'Отключенные конкретные события',
		},
		priorityEvents: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: [],
			comment: 'Приоритетные события',
		},
	},
	{
		indexes: [
			{
				fields: ['userId'],
				name: 'usereventsettings_user_id_idx',
				unique: true,
			},
		],
	}
);

const Token = sequelize.define(
	'token',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		refreshToken: {
			type: DataTypes.TEXT,
			allowNull: false,
			comment: 'JWT refresh token (может быть длиннее 255 символов)',
		},
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
		userId: { type: DataTypes.BIGINT, allowNull: false },
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

const Artifact = sequelize.define(
	'artifact',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		seed: { type: DataTypes.STRING, unique: true },
		artifactTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		name: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT },

		tradable: { type: DataTypes.BOOLEAN, defaultValue: true },
	},
	{
		indexes: [
			{
				fields: ['userId'],
				name: 'artifact_user_id_idx',
			},
			{
				fields: ['artifactTemplateId'],
				name: 'artifact_artifact_template_id_idx',
			},
			{
				fields: ['seed'],
				name: 'artifact_seed_idx',
			},
			{
				fields: ['tradable'],
				name: 'artifact_tradable_idx',
			},
		],
	}
);

const ArtifactTemplate = sequelize.define('artifacttemplate', {
	id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
	slug: { type: DataTypes.STRING, unique: true, allowNull: false },
	name: { type: DataTypes.STRING },
	description: { type: DataTypes.TEXT },
	rarity: {
		type: DataTypes.ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'),
		defaultValue: 'COMMON',
	},
	image: { type: DataTypes.STRING },
	effects: {
		type: DataTypes.JSONB,
		defaultValue: {},
		comment: 'Например: { chaos: 0.1, stability: -0.2 }',
	},
	limited: { type: DataTypes.BOOLEAN, defaultValue: false },
	limitedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
	limitedDuration: { type: DataTypes.INTEGER, defaultValue: 0 },
	limitedDurationType: {
		type: DataTypes.ENUM('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'),
		defaultValue: 'HOUR',
	},
	limitedDurationValue: { type: DataTypes.INTEGER, defaultValue: 0 },

	indexes: [
		{
			fields: ['slug'],
			name: 'artifacttemplate_slug_idx',
		},
		{
			fields: ['rarity'],
			name: 'artifacttemplate_rarity_idx',
		},
		{
			fields: ['limited'],
			name: 'artifacttemplate_limited_idx',
		},
	],
});

const UpgradeNodeTemplate = sequelize.define(
	'upgradenodetemplate',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		slug: { type: DataTypes.STRING, unique: true, allowNull: false },
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
			type: DataTypes.ENUM('stardust', 'darkMatter', 'stars'),
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
	},
	{
		indexes: [
			{
				fields: ['slug'],
				name: 'upgradenodetemplate_slug_idx',
			},
		],
	}
);

const TaskTemplate = sequelize.define(
	'tasktemplate',
	{
		id: {
			type: DataTypes.BIGINT,
			primaryKey: true,
			autoIncrement: true,
		},
		slug: { type: DataTypes.STRING, unique: true, allowNull: false },
		title: {
			type: DataTypes.JSONB,
			defaultValue: {
				en: '',
				ru: '',
			},
			allowNull: false,
			comment: 'Localized task descriptions',
		},
		description: {
			type: DataTypes.JSONB,
			allowNull: false,
		},
		reward: {
			type: DataTypes.JSONB,
			defaultValue: { type: 'stardust', amount: 0 },
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
	},
	{
		indexes: [
			{
				fields: ['slug'],
				name: 'tasktemplate_slug_idx',
			},
		],
	}
);

const EventTemplate = sequelize.define(
	'eventtemplate',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		slug: { type: DataTypes.STRING, unique: true, allowNull: false },
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
				'PASSIVE',
				'RESOURCE_BASED',
				'UPGRADE_DEPENDENT',
				'TASK_DEPENDENT',
				'MARKET_DEPENDENT',
				'MULTIPLAYER',
				'PROGRESSIVE',
				'TIERED'
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
- GLOBAL_TIMED: { at: '2025-07-01T00:00:00Z' }
- RESOURCE_BASED: { resource: 'stardust', threshold: 1000, operator: '>' }
- UPGRADE_DEPENDENT: { upgradeId: 'upgrade_id', level: 3 }
- TASK_DEPENDENT: { taskId: 'task_id', progress: 50 }
- MARKET_DEPENDENT: { action: 'purchase', itemType: 'artifact' }
- MULTIPLAYER: { minPlayers: 2, maxPlayers: 5, duration: '2h' }
- PROGRESSIVE: { stages: [{ threshold: 100, reward: 10 }, { threshold: 200, reward: 20 }] }
- TIERED: { tier: 1, requirements: { resources: { stardust: 1000 }, upgrades: ['upgrade_id'] } }`,
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
	},
	{
		indexes: [
			{
				fields: ['slug'],
				name: 'eventtemplate_slug_idx',
			},
		],
	}
);

// --- MARKET MODELS ---

const MarketOffer = sequelize.define(
	'marketoffer',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		sellerId: { type: DataTypes.BIGINT, allowNull: false },
		itemType: {
			type: DataTypes.ENUM(
				'artifact',
				'galaxy',
				'task',
				'package',
				'event',
				'upgrade',
				'farming'
			),
			allowNull: false,
		},
		itemId: { type: DataTypes.BIGINT, allowNull: false }, // id предмета (artifactId, galaxyId и т.д.)
		amount: { type: DataTypes.DECIMAL, allowNull: false },
		resource: {
			type: DataTypes.ENUM('stardust', 'darkMatter', 'stars'),
			allowNull: false,
		},
		price: { type: DataTypes.DECIMAL(30, 8), allowNull: false },
		currency: {
			type: DataTypes.ENUM(
				'tgStars',
				'tonToken',
				'stars',
				'stardust',
				'darkMatter'
			),
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'),
			defaultValue: 'ACTIVE',
		},
		offerType: {
			type: DataTypes.ENUM('SYSTEM', 'P2P', 'PERSONAL'),
			allowNull: false,
			defaultValue: 'SYSTEM',
		},
		createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		expiresAt: { type: DataTypes.DATE, allowNull: true },
		isItemLocked: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		}, // Флаг блокировки ресурса или объекта
	},
	{
		indexes: [
			{
				fields: ['sellerId'],
				name: 'marketoffer_seller_id_idx',
			},
			{
				fields: ['status'],
				name: 'marketoffer_status_idx',
			},
			{
				fields: ['itemType'],
				name: 'marketoffer_item_type_idx',
			},
		],
	}
);

const MarketTransaction = sequelize.define(
	'markettransaction',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		offerId: { type: DataTypes.BIGINT, allowNull: false },
		buyerId: { type: DataTypes.BIGINT, allowNull: false },
		sellerId: { type: DataTypes.BIGINT, allowNull: false },
		status: {
			type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
			defaultValue: 'PENDING',
		},
		createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		completedAt: { type: DataTypes.DATE, allowNull: true },
	},
	{
		indexes: [
			{
				fields: ['offerId'],
				name: 'markettransaction_offer_id_idx',
			},
			{
				fields: ['buyerId'],
				name: 'markettransaction_buyer_id_idx',
			},
			{
				fields: ['sellerId'],
				name: 'markettransaction_seller_id_idx',
			},
			{
				fields: ['status'],
				name: 'markettransaction_status_idx',
			},
		],
	}
);

const PaymentTransaction = sequelize.define(
	'paymenttransaction',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		marketTransactionId: { type: DataTypes.BIGINT, allowNull: false },
		fromAccount: { type: DataTypes.BIGINT, allowNull: false }, // userId или 'system_wallet'
		toAccount: { type: DataTypes.BIGINT, allowNull: false }, // userId или 'system_wallet'
		priceOrAmount: { type: DataTypes.DECIMAL(30, 8), allowNull: false },
		currencyOrResource: {
			type: DataTypes.ENUM(
				'tgStars',
				'tonToken',
				'stars',
				'stardust',
				'darkMatter'
			),
			allowNull: false,
		},
		txType: {
			type: DataTypes.ENUM(
				'BUYER_TO_CONTRACT',
				'CONTRACT_TO_SELLER',
				'FEE',
				'RESOURCE_TRANSFER',
				'UPGRADE_RESOURCE',
				'TASK_RESOURCE',
				'EVENT_RESOURCE',
				'FARMING_RESOURCE',
				'GALAXY_RESOURCE',
				'ARTIFACT_RESOURCE',
				'STARS_TRANSFER',
				'TON_TRANSFER',
				'TG_STARS_TRANSFER',
				'STARDUST_TRANSFER',
				'DARK_MATTER_TRANSFER'
			),
			allowNull: false,
		},
		blockchainTxId: {
			type: DataTypes.STRING,
			allowNull: true,
			comment: 'ID транзакции в блокчейне',
		},
		status: {
			type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'),
			defaultValue: 'PENDING',
		},
		createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
		confirmedAt: { type: DataTypes.DATE, allowNull: true },
	},
	{
		indexes: [
			{
				fields: ['marketTransactionId'],
				name: 'paymenttransaction_market_transaction_id_idx',
			},
		],
	}
);

const MarketCommission = sequelize.define(
	'marketcommission',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		currency: {
			type: DataTypes.ENUM('tgStars', 'tonToken'),
			unique: true,
			allowNull: false,
		},
		rate: { type: DataTypes.FLOAT, allowNull: false },
		description: { type: DataTypes.STRING, allowNull: true },
	},
	{ tableName: 'marketcommissions' }
);

const PackageStore = sequelize.define(
	'packagestore',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true },
		userId: { type: DataTypes.BIGINT, allowNull: false },
		packageTemplateId: { type: DataTypes.BIGINT, allowNull: false },
		amount: { type: DataTypes.INTEGER, allowNull: false },
		resource: {
			type: DataTypes.ENUM('stardust', 'darkMatter', 'stars'),
			allowNull: false,
		},
		price: { type: DataTypes.DECIMAL(30, 8), allowNull: false },
		currency: {
			type: DataTypes.ENUM(
				'tgStars',
				'tonToken',
				'stars',
				'stardust',
				'darkMatter'
			),
			allowNull: false,
		},
		status: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
		isUsed: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},
		isLocked: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},
	},
	{
		indexes: [
			{
				fields: ['userId'],
				name: 'packagestore_user_id_idx',
			},
			{
				fields: ['packageTemplateId'],
				name: 'packagestore_package_template_id_idx',
			},
		],
	}
);

const PackageTemplate = sequelize.define(
	'packagetemplate',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		slug: { type: DataTypes.STRING, unique: true, allowNull: false },
		name: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: true },
		amount: { type: DataTypes.INTEGER, allowNull: false },
		resource: {
			type: DataTypes.ENUM('stardust', 'darkMatter', 'stars'),
			allowNull: false,
		},
		price: { type: DataTypes.DECIMAL(30, 8), allowNull: false },
		currency: {
			type: DataTypes.ENUM(
				'tgStars',
				'tonToken',
				'stars',
				'stardust',
				'darkMatter'
			),
			allowNull: false,
		},
		status: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		imageUrl: { type: DataTypes.STRING, allowNull: true },
		sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
		category: { type: DataTypes.STRING, allowNull: true },
		isPromoted: { type: DataTypes.BOOLEAN, defaultValue: false },
		validUntil: { type: DataTypes.DATE, allowNull: true },
	},
	{
		indexes: [
			{
				fields: ['slug'],
				name: 'packagetemplate_slug_idx',
			},
		],
	}
);

const Admin = sequelize.define(
	'admin',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, defaultValue: 0 },
		email: { type: DataTypes.STRING, unique: true, allowNull: false },
		google_id: { type: DataTypes.STRING, unique: true, allowNull: true },
		google2faSecret: {
			type: DataTypes.STRING,
			allowNull: true,
			comment: 'Google 2FA secret (base32)',
		},
		role: {
			type: DataTypes.ENUM('ADMIN', 'SUPERVISOR'),
			defaultValue: 'SUPERVISOR',
		},
		is_superadmin: { type: DataTypes.BOOLEAN, defaultValue: false },
		is_2fa_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
		blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
	},
	{
		indexes: [{ fields: ['email'] }, { fields: ['google_id'] }],
	}
);
const AdminToken = sequelize.define(
	'admintoken',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		adminId: { type: DataTypes.BIGINT, allowNull: false },
		refreshToken: {
			type: DataTypes.TEXT,
			allowNull: false,
			comment:
				'JWT refresh token для админов (может быть длиннее 255 символов)',
		},
	},
	{
		indexes: [
			{ fields: ['refreshToken'], name: 'admintoken_refresh_token_idx' },
			{
				fields: ['adminId'],
				name: 'admintoken_admin_id_idx',
			},
		],
	}
);
const AdminInvite = sequelize.define(
	'admininvite',
	{
		id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
		adminId: { type: DataTypes.BIGINT, allowNull: false },
		email: { type: DataTypes.STRING, allowNull: false },
		token: { type: DataTypes.STRING, allowNull: false },
		usedAt: { type: DataTypes.DATE, allowNull: true },
	},
	{
		indexes: [
			{ fields: ['email'], name: 'admininvite_email_idx' },
			{ fields: ['adminId'], name: 'admininvite_admin_id_idx' },
		],
	}
);

User.hasOne(UserState);
UserState.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Token);
Token.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Galaxy);
Galaxy.belongsTo(User, { foreignKey: 'userId' });

Artifact.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Artifact);

// --- MARKET RELATIONS ---
User.hasMany(MarketOffer, { foreignKey: 'sellerId', as: 'marketoffers' });
MarketOffer.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(MarketTransaction, {
	as: 'buyertransactions',
	foreignKey: 'buyerId',
});
User.hasMany(MarketTransaction, {
	as: 'sellertransactions',
	foreignKey: 'sellerId',
});
MarketTransaction.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
MarketTransaction.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });

MarketTransaction.belongsTo(MarketOffer, { foreignKey: 'offerId' });

PaymentTransaction.belongsTo(MarketTransaction, {
	foreignKey: 'marketTransactionId',
});

PaymentTransaction.belongsTo(User, { foreignKey: 'fromAccount', as: 'payer' });
PaymentTransaction.belongsTo(User, { foreignKey: 'toAccount', as: 'payee' });

User.hasMany(PaymentTransaction, {
	foreignKey: 'fromAccount',
	as: 'sentpayments',
});
User.hasMany(PaymentTransaction, {
	foreignKey: 'toAccount',
	as: 'receivedpayments',
});

// Связь для пакетов
User.hasMany(PackageStore, { foreignKey: 'userId' });
PackageStore.belongsTo(User, { foreignKey: 'userId' });

PackageTemplate.hasMany(PackageStore);
PackageStore.belongsTo(PackageTemplate, { foreignKey: 'packageTemplateId' });

// Связи для новых моделей
User.hasMany(UserUpgrade);
UserUpgrade.belongsTo(User, { foreignKey: 'userId' });

UpgradeNodeTemplate.hasMany(UserUpgrade);
UserUpgrade.belongsTo(UpgradeNodeTemplate, { foreignKey: 'nodeId' });

User.hasMany(UserTask);
UserTask.belongsTo(User, { foreignKey: 'userId' });

TaskTemplate.hasMany(UserTask);
UserTask.belongsTo(TaskTemplate, { foreignKey: 'taskId' });

User.hasMany(UserEvent);
UserEvent.belongsTo(User, { foreignKey: 'userId' });

EventTemplate.hasMany(UserEvent);
UserEvent.belongsTo(EventTemplate, { foreignKey: 'eventId' });

User.hasOne(UserEventSetting);
UserEventSetting.belongsTo(User, { foreignKey: 'userId' });

Admin.hasOne(AdminToken);
AdminToken.belongsTo(Admin, { foreignKey: 'adminId' });

Admin.hasMany(AdminInvite);
AdminInvite.belongsTo(Admin, { foreignKey: 'adminId' });

ArtifactTemplate.hasMany(Artifact, { foreignKey: 'artifactTemplateId' });
Artifact.belongsTo(ArtifactTemplate, { foreignKey: 'artifactTemplateId' });

module.exports = {
	// ADMIN
	Admin,
	AdminToken,
	AdminInvite,

	// USER
	User,
	UserState,
	Token,

	// GALAXY
	Galaxy,

	Artifact,
	ArtifactTemplate,

	// MARKET
	MarketOffer,
	MarketTransaction,
	PaymentTransaction,
	MarketCommission,

	// UPGRADES
	PackageStore,
	UserUpgrade,
	UserTask,
	UserEvent,
	UserEventSetting,

	// TEMPLATES
	UpgradeNodeTemplate,
	TaskTemplate,
	EventTemplate,
	PackageTemplate,
};
