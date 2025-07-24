'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create Admin table
		await queryInterface.createTable('admins', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			google_id: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			google2faSecret: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			role: {
				type: Sequelize.ENUM('ADMIN', 'SUPERVISOR'),
				defaultValue: 'SUPERVISOR',
			},
			is_superadmin: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			is_2fa_enabled: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create AdminToken table
		await queryInterface.createTable('admintokens', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			adminId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			refreshToken: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
		});

		// Create AdminInvite table
		await queryInterface.createTable('admininvites', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			adminId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			token: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			usedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create User table
		await queryInterface.createTable('users', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				defaultValue: 0,
			},
			username: {
				type: Sequelize.STRING,
			},
			referral: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
			},
			role: {
				type: Sequelize.ENUM('USER', 'SYSTEM'),
				defaultValue: 'USER',
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			tonWallet: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserState table
		await queryInterface.createTable('userstates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				unique: true,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			stardust: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			darkMatter: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			stars: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			tgStars: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			tonToken: {
				type: Sequelize.FLOAT,
				allowNull: false,
				defaultValue: 0,
			},
			lastLoginDate: {
				type: Sequelize.DATEONLY,
				allowNull: true,
			},
			currentStreak: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			maxStreak: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			streakUpdatedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			chaosLevel: { type: Sequelize.FLOAT, defaultValue: 0.0 },
			stabilityLevel: { type: Sequelize.FLOAT, defaultValue: 0.0 },
			entropyVelocity: { type: Sequelize.FLOAT, defaultValue: 0.0 },
			lastDailyBonus: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			lockedStardust: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			lockedDarkMatter: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			lockedStars: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			stateHistory: {
				type: Sequelize.JSONB,
				defaultValue: [],
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create Token table
		await queryInterface.createTable('tokens', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			refreshToken: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create Galaxy table
		await queryInterface.createTable('galaxies', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			starMin: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			starCurrent: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			price: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
			},
			particleCount: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			onParticleCountChange: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			galaxyProperties: {
				type: Sequelize.JSONB,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create ArtifactTemplate table
		await queryInterface.createTable('artifacttemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			slug: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
			},
			rarity: {
				type: Sequelize.ENUM(
					'COMMON',
					'UNCOMMON',
					'RARE',
					'EPIC',
					'LEGENDARY'
				),
				defaultValue: 'COMMON',
			},
			image: {
				type: Sequelize.STRING,
			},
			effects: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Например: { chaos: 0.1, stability: -0.2 }',
			},
			limited: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			limitedCount: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			limitedDuration: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			limitedDurationType: {
				type: Sequelize.ENUM('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'),
				defaultValue: 'HOUR',
			},
			limitedDurationValue: { type: Sequelize.INTEGER, defaultValue: 0 },

			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create Artifact table
		await queryInterface.createTable('artifacts', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: true,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'SET NULL',
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
			},
			artifactTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'artifacttemplates',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			tradable: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UpgradeNodeTemplate table
		await queryInterface.createTable('upgradenodetemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				unique: true,
			},
			slug: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
			},
			description: {
				type: Sequelize.JSONB,
				defaultValue: {
					en: '',
					ru: '',
				},
				comment: 'Localized upgrade node descriptions',
			},
			maxLevel: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			basePrice: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			effectPerLevel: {
				type: Sequelize.FLOAT,
				defaultValue: 0,
			},
			priceMultiplier: {
				type: Sequelize.FLOAT,
				defaultValue: 1.0,
			},
			currency: {
				type: Sequelize.ENUM('stardust', 'darkmetter', 'stars'),
				defaultValue: 'stardust',
			},
			category: {
				type: Sequelize.ENUM(
					'production',
					'economy',
					'special',
					'chance',
					'storage',
					'multiplier'
				),
				defaultValue: 'production',
			},
			icon: {
				type: Sequelize.STRING(3),
				defaultValue: '',
			},
			stability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			instability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			modifiers: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Additional modifiers and effects of the upgrade',
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment:
					'Conditions required to unlock or purchase the upgrade',
			},
			delayedUntil: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Timestamp until which the upgrade is delayed',
			},
			children: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				comment:
					'Array of node names that are unlocked by this upgrade',
			},
			weight: {
				type: Sequelize.INTEGER,
				defaultValue: 1,
				comment: 'Weight/difficulty of the upgrade node',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create TaskTemplate table
		await queryInterface.createTable('tasktemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
			},
			slug: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			title: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: 'Localized task descriptions',
			},
			description: {
				type: Sequelize.JSONB,
				allowNull: false,
			},
			reward: {
				type: Sequelize.JSONB,
				defaultValue: { type: 'stardust', amount: 0 },
				allowNull: false,
			},
			condition: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: 'Condition for the task to be completed',
			},
			icon: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create EventTemplate table
		await queryInterface.createTable('eventtemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				unique: true,
			},
			slug: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.JSONB,
				defaultValue: {
					en: '',
					ru: '',
				},
				comment: 'Localized event descriptions',
			},
			type: {
				type: Sequelize.ENUM(
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
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Dynamic trigger logic depending on type',
			},
			effect: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: 'Effect configuration (multiplier, duration, etc)',
			},
			frequency: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Frequency settings for RANDOM and PERIODIC events',
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Conditions that must be met for the event to trigger',
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserUpgrade table
		await queryInterface.createTable('userupgrades', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			upgradeNodeTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'upgradenodetemplates',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			level: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			progress: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			targetProgress: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			completed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			stability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			instability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			progressHistory: {
				type: Sequelize.JSONB,
				defaultValue: [],
			},
			lastProgressUpdate: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserTask table
		await queryInterface.createTable('usertasks', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			taskTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'tasktemplates',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			progress: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			targetProgress: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			completed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			reward: {
				type: Sequelize.JSONB,
				defaultValue: { type: 'stardust', amount: 0 },
			},
			progressHistory: {
				type: Sequelize.JSONB,
				defaultValue: [],
			},
			lastProgressUpdate: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			completedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserEvent table
		await queryInterface.createTable('userevents', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			eventTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'eventtemplates',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			status: {
				type: Sequelize.ENUM(
					'ACTIVE',
					'EXPIRED',
					'COMPLETED',
					'CANCELLED'
				),
				defaultValue: 'ACTIVE',
			},
			triggeredAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			effects: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Эффекты события (множители и т.д.)',
			},
			progress: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Прогресс выполнения события',
			},
			completedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UserEventSetting table
		await queryInterface.createTable('usereventsettings', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				unique: true,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			eventMultipliers: {
				type: Sequelize.JSONB,
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
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
				comment: 'Последнее время проверки событий',
			},
			eventCooldowns: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Кулдауны для разных типов событий',
			},
			enabledTypes: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
				comment: 'Включенные типы событий',
			},
			disabledEvents: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				comment: 'Отключенные конкретные события',
			},
			priorityEvents: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				comment: 'Приоритетные события',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create MarketOffer table
		await queryInterface.createTable('marketoffers', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			itemType: {
				type: Sequelize.ENUM(
					'artifact',
					'galaxy',
					'resource',
					'package',
					'event',
					'upgrade',
					'farming'
				),
				allowNull: false,
			},
			itemId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			amount: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			resource: {
				type: Sequelize.ENUM('stardust', 'darkMatter', 'stars'),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM(
					'tgStars',
					'tonToken',
					'stars',
					'stardust',
					'darkMatter'
				),
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM(
					'ACTIVE',
					'COMPLETED',
					'CANCELLED',
					'EXPIRED'
				),
				defaultValue: 'ACTIVE',
			},
			offerType: {
				type: Sequelize.ENUM('SYSTEM', 'P2P', 'PERSONAL'),
				allowNull: false,
				defaultValue: 'SYSTEM',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			isItemLocked: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create MarketTransaction table
		await queryInterface.createTable('markettransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			offerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'marketoffers',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			buyerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			status: {
				type: Sequelize.ENUM(
					'PENDING',
					'COMPLETED',
					'FAILED',
					'CANCELLED'
				),
				defaultValue: 'PENDING',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			completedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create PaymentTransaction table
		await queryInterface.createTable('paymenttransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			marketTransactionId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'markettransactions',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			fromAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			toAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			priceOrAmount: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currencyOrResource: {
				type: Sequelize.ENUM(
					'tgStars',
					'tonToken',
					'stars',
					'stardust',
					'darkMatter'
				),
				allowNull: false,
			},
			txType: {
				type: Sequelize.ENUM(
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
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'ID транзакции в блокчейне',
			},
			status: {
				type: Sequelize.ENUM(
					'PENDING',
					'CONFIRMED',
					'FAILED',
					'CANCELLED'
				),
				defaultValue: 'PENDING',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			confirmedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		await queryInterface.createTable('packagetemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			slug: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			amount: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			resource: {
				type: Sequelize.ENUM('stardust', 'darkMatter', 'stars'),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('tgStars', 'tonToken'),
				allowNull: false,
			},
			status: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			imageUrl: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			sortOrder: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			category: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			isPromoted: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			validUntil: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create PackageStore table after packagetemplates
		await queryInterface.createTable('packagestores', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			packageTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'packagetemplates',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			amount: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			resource: {
				type: Sequelize.ENUM('stardust', 'darkMatter', 'stars'),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('tgStars', 'tonToken'),
				allowNull: false,
			},
			status: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			isUsed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			isLocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create MarketCommission table
		await queryInterface.createTable('marketcommissions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			currency: {
				type: Sequelize.ENUM(
					'tgStars',
					'tonToken',
					'stardust',
					'darkMatter'
				),
				unique: true,
				allowNull: false,
			},
			rate: {
				type: Sequelize.FLOAT,
				allowNull: false,
			},
			description: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Package tables will be created in separate migration

		// Create all indexes
		await queryInterface.addIndex('admininvites', ['email'], {
			name: 'admininvite_email_idx',
		});
		await queryInterface.addIndex('admininvites', ['adminId'], {
			name: 'admininvite_admin_id_idx',
		});

		await queryInterface.addIndex('admins', ['email'], {
			name: 'admin_email_idx',
		});
		await queryInterface.addIndex('admins', ['google_id'], {
			name: 'admin_google_id_idx',
		});

		await queryInterface.addIndex('admintokens', ['adminId'], {
			name: 'admintoken_admin_id_idx',
		});
		await queryInterface.addIndex('admintokens', ['refreshToken'], {
			name: 'admintoken_refresh_token_idx',
		});

		await queryInterface.addIndex('tokens', ['refreshToken']);
		await queryInterface.addIndex('tokens', ['userId'], {
			name: 'token_user_id_idx',
		});

		await queryInterface.addIndex('galaxies', ['seed'], {
			name: 'galaxy_seed_idx',
		});
		await queryInterface.addIndex('galaxies', ['userId'], {
			name: 'galaxy_user_id_idx',
		});

		await queryInterface.addIndex('userupgrades', ['userId'], {
			name: 'userupgrades_user_id_idx',
		});
		await queryInterface.addIndex(
			'userupgrades',
			['upgradeNodeTemplateId'],
			{
				name: 'userupgrades_upgrade_node_template_id_idx',
			}
		);

		await queryInterface.addIndex('userupgrades', ['completed'], {
			name: 'userupgrades_completed_idx',
		});

		await queryInterface.addIndex('usertasks', ['userId'], {
			name: 'usertasks_user_id_idx',
		});
		await queryInterface.addIndex('usertasks', ['taskTemplateId'], {
			name: 'usertasks_task_template_id_idx',
		});

		await queryInterface.addIndex('usertasks', ['completed'], {
			name: 'usertasks_completed_idx',
		});
		await queryInterface.addIndex('usertasks', ['active'], {
			name: 'usertasks_active_idx',
		});

		await queryInterface.addIndex('userevents', ['userId'], {
			name: 'userevents_user_id_idx',
		});
		await queryInterface.addIndex('userevents', ['eventTemplateId'], {
			name: 'userevents_event_template_id_idx',
		});
		await queryInterface.addIndex('userevents', ['status'], {
			name: 'userevents_status_idx',
		});
		await queryInterface.addIndex('userevents', ['expiresAt'], {
			name: 'userevents_expires_at_idx',
		});
		await queryInterface.addIndex('userevents', ['triggeredAt'], {
			name: 'userevents_triggered_at_idx',
		});

		await queryInterface.addIndex('usereventsettings', ['userId'], {
			name: 'usereventsettings_user_id_idx',
			unique: true,
		});

		await queryInterface.addIndex('marketoffers', ['sellerId'], {
			name: 'marketoffers_seller_id_idx',
		});
		await queryInterface.addIndex('marketoffers', ['status'], {
			name: 'marketoffers_status_idx',
		});
		await queryInterface.addIndex('marketoffers', ['expiresAt'], {
			name: 'marketoffers_expires_at_idx',
		});

		await queryInterface.addIndex('markettransactions', ['offerId'], {
			name: 'markettransactions_offer_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['buyerId'], {
			name: 'markettransactions_buyer_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['sellerId'], {
			name: 'markettransactions_seller_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['status'], {
			name: 'markettransactions_status_idx',
		});

		await queryInterface.addIndex(
			'paymenttransactions',
			['marketTransactionId'],
			{
				name: 'paymenttransactions_market_transaction_id_idx',
			}
		);
		await queryInterface.addIndex('paymenttransactions', ['fromAccount'], {
			name: 'paymenttransactions_from_account_idx',
		});
		await queryInterface.addIndex('paymenttransactions', ['toAccount'], {
			name: 'paymenttransactions_to_account_idx',
		});
		await queryInterface.addIndex('paymenttransactions', ['status'], {
			name: 'paymenttransactions_status_idx',
		});

		// Package indexes will be created in separate migration
		await queryInterface.addIndex('artifacttemplates', ['rarity'], {
			name: 'artifacttemplate_rarity_idx',
		});
		await queryInterface.addIndex('artifacttemplates', ['slug'], {
			name: 'artifacttemplate_slug_idx',
		});
		await queryInterface.addIndex('artifacttemplates', ['limited'], {
			name: 'artifacttemplate_limited_idx',
		});
		await queryInterface.addIndex('eventtemplates', ['slug'], {
			name: 'eventtemplate_slug_idx',
		});
		await queryInterface.addIndex('upgradenodetemplates', ['slug'], {
			name: 'upgradenodetemplate_slug_idx',
		});
		await queryInterface.addIndex('tasktemplates', ['slug'], {
			name: 'tasktemplate_slug_idx',
		});
		await queryInterface.addIndex('userstates', ['userId'], {
			name: 'userstate_user_id_idx',
		});
		// Package indexes will be created in separate migration
		await queryInterface.addIndex('packagetemplates', ['slug'], {
			name: 'packagetemplate_slug_idx',
		});

		await queryInterface.addIndex('packagestores', ['packageTemplateId'], {
			name: 'packagestores_package_template_id_idx',
		});
		await queryInterface.addIndex('packagestores', ['userId'], {
			name: 'packagestores_user_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		// Package tables will be dropped in separate migration
		await queryInterface.dropTable('marketcommissions');
		await queryInterface.dropTable('paymenttransactions');
		await queryInterface.dropTable('markettransactions');
		await queryInterface.dropTable('marketoffers');
		await queryInterface.dropTable('usereventsettings');
		await queryInterface.dropTable('userevents');
		await queryInterface.dropTable('usertasks');
		await queryInterface.dropTable('userupgrades');
		await queryInterface.dropTable('eventtemplates');
		await queryInterface.dropTable('tasktemplates');
		await queryInterface.dropTable('upgradenodetemplates');
		await queryInterface.dropTable('artifacts');
		await queryInterface.dropTable('artifacttemplates');
		await queryInterface.dropTable('galaxies');
		await queryInterface.dropTable('tokens');
		await queryInterface.dropTable('userstates');
		await queryInterface.dropTable('users');
		await queryInterface.dropTable('admininvites');
		await queryInterface.dropTable('admins');
		await queryInterface.dropTable('admintokens');
		await queryInterface.dropTable('packagestores');
		await queryInterface.dropTable('packagetemplates');
	},
};
