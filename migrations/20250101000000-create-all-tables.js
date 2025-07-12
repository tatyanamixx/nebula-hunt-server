'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
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
				type: Sequelize.ENUM('USER', 'ADMIN', 'SYSTEM'),
				defaultValue: 'USER',
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			google2faSecret: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'Google 2FA secret (base32)',
			},
			tonWallet: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'TON wallet address of the user',
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
			tgStars: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
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
			lockedTgStars: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
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

		// Create UpgradeNode table
		await queryInterface.createTable('upgradenodes', {
			id: {
				type: Sequelize.STRING(50),
				primaryKey: true,
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
			resource: {
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
				type: Sequelize.STRING,
				primaryKey: true,
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
				type: Sequelize.INTEGER,
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
				type: Sequelize.STRING(20),
				primaryKey: true,
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
			nodeId: {
				type: Sequelize.STRING(50),
				allowNull: false,
				references: {
					model: 'upgradenodes',
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
			taskId: {
				type: Sequelize.STRING,
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
				type: Sequelize.INTEGER,
				defaultValue: 0,
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
			eventId: {
				type: Sequelize.STRING(20),
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
					'package'
				),
				allowNull: false,
			},
			itemId: {
				type: Sequelize.STRING,
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
				type: Sequelize.ENUM(
					'ACTIVE',
					'COMPLETED',
					'CANCELLED',
					'EXPIRED'
				),
				defaultValue: 'ACTIVE',
			},
			offerType: {
				type: Sequelize.ENUM('SYSTEM', 'P2P'),
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
				defaultValue: true,
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
			amount: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('tgStars', 'tonToken'),
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
					'GALAXY_RESOURCE'
				),
				allowNull: false,
			},
			blockchainTxId: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'ID транзакции в блокчейне',
			},
			status: {
				type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
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

		// Create PackageStore table
		await queryInterface.createTable('packagestores', {
			id: {
				type: Sequelize.STRING,
				primaryKey: true,
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
				type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
				defaultValue: 'ACTIVE',
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

		// Create PackageTemplate table
		await queryInterface.createTable('packagetemplates', {
			id: {
				type: Sequelize.STRING,
				primaryKey: true,
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
				type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
				defaultValue: 'ACTIVE',
				allowNull: false,
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

		// Create all indexes
		await queryInterface.addIndex('users', ['referral'], {
			name: 'user_referral_idx',
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
		await queryInterface.addIndex('userupgrades', ['nodeId'], {
			name: 'userupgrades_node_id_idx',
		});
		await queryInterface.addIndex('userupgrades', ['userId', 'nodeId'], {
			name: 'userupgrades_user_node_idx',
			unique: true,
		});
		await queryInterface.addIndex('userupgrades', ['completed'], {
			name: 'userupgrades_completed_idx',
		});

		await queryInterface.addIndex('usertasks', ['userId'], {
			name: 'usertasks_user_id_idx',
		});
		await queryInterface.addIndex('usertasks', ['taskId'], {
			name: 'usertasks_task_id_idx',
		});
		await queryInterface.addIndex('usertasks', ['userId', 'taskId'], {
			name: 'usertasks_user_task_idx',
			unique: true,
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
		await queryInterface.addIndex('userevents', ['eventId'], {
			name: 'userevents_event_id_idx',
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
		await queryInterface.addIndex('usereventsettings', ['lastEventCheck'], {
			name: 'usereventsettings_last_event_check_idx',
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

		await queryInterface.addIndex('packagestores', ['userId'], {
			name: 'packagestores_user_id_idx',
		});
		await queryInterface.addIndex('packagestores', ['status'], {
			name: 'packagestores_status_idx',
		});

		await queryInterface.addIndex('packagetemplates', ['status'], {
			name: 'packagetemplate_status_idx',
		});
		await queryInterface.addIndex('packagetemplates', ['category'], {
			name: 'packagetemplate_category_idx',
		});
		await queryInterface.addIndex('packagetemplates', ['sortOrder'], {
			name: 'packagetemplate_sort_order_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable('packagetemplates');
		await queryInterface.dropTable('packagestores');
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
		await queryInterface.dropTable('upgradenodes');
		await queryInterface.dropTable('artifacts');
		await queryInterface.dropTable('galaxies');
		await queryInterface.dropTable('tokens');
		await queryInterface.dropTable('userstates');
		await queryInterface.dropTable('users');
	},
};
