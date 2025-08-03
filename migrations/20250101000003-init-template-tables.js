'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу upgradenodetemplates
		await queryInterface.createTable('upgradenodetemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			slug: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			description: {
				type: Sequelize.JSONB,
				defaultValue: {
					en: '',
					ru: '',
				},
				allowNull: false,
				comment: 'Localized upgrade node descriptions',
			},
			maxLevel: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			basePrice: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			effectPerLevel: {
				type: Sequelize.FLOAT,
				defaultValue: 0,
				allowNull: false,
			},
			priceMultiplier: {
				type: Sequelize.FLOAT,
				defaultValue: 1.0,
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('stardust', 'darkmatter', 'stars'),
				defaultValue: 'stardust',
				allowNull: false,
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
				allowNull: false,
			},
			icon: {
				type: Sequelize.STRING(3),
				defaultValue: '',
				allowNull: false,
			},
			stability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
				allowNull: false,
			},
			instability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
				allowNull: false,
			},
			modifiers: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: 'Additional modifiers and effects of the upgrade',
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
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
				allowNull: false,
				comment:
					'Array of node names that are unlocked by this upgrade',
			},
			weight: {
				type: Sequelize.INTEGER,
				defaultValue: 1,
				allowNull: false,
				comment: 'Weight/difficulty of the upgrade node',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// 2. Создаем таблицу tasktemplates
		await queryInterface.createTable('tasktemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			slug: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			title: {
				type: Sequelize.JSONB,
				defaultValue: {
					en: '',
					ru: '',
				},
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
				allowNull: false,
			},
			sortOrder: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// 3. Создаем таблицу eventtemplates
		await queryInterface.createTable('eventtemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
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
				type: Sequelize.JSONB,
				defaultValue: {
					en: '',
					ru: '',
				},
				allowNull: false,
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
				allowNull: false,
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
				allowNull: false,
				comment: 'Frequency settings for RANDOM and PERIODIC events',
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: 'Conditions that must be met for the event to trigger',
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// 4. Создаем таблицу packagetemplates
		await queryInterface.createTable('packagetemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
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
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			icon: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			sortOrder: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			labelKey: {
				type: Sequelize.STRING(500),
				allowNull: true,
			},
			isPromoted: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			validUntil: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Создаем индексы
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS upgradenodetemplate_slug_idx ON upgradenodetemplates ("slug");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS tasktemplate_slug_idx ON tasktemplates ("slug");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS eventtemplate_slug_idx ON eventtemplates ("slug");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplate_slug_idx ON packagetemplates ("slug");
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем индексы
		await queryInterface.removeIndex(
			'packagetemplates',
			'packagetemplate_slug_idx'
		);
		await queryInterface.removeIndex(
			'eventtemplates',
			'eventtemplate_slug_idx'
		);
		await queryInterface.removeIndex(
			'tasktemplates',
			'tasktemplate_slug_idx'
		);
		await queryInterface.removeIndex(
			'upgradenodetemplates',
			'upgradenodetemplate_slug_idx'
		);

		// Удаляем таблицы
		await queryInterface.dropTable('packagetemplates');
		await queryInterface.dropTable('eventtemplates');
		await queryInterface.dropTable('tasktemplates');
		await queryInterface.dropTable('upgradenodetemplates');
	},
};
