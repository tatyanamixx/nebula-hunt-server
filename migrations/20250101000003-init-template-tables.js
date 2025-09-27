"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу upgradenodetemplates
		await queryInterface.createTable("upgradenodetemplates", {
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
					en: "",
					ru: "",
				},
				allowNull: false,
				comment: "Localized upgrade node descriptions",
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
				type: Sequelize.ENUM("stardust", "darkmatter", "stars"),
				defaultValue: "stardust",
				allowNull: false,
			},
			category: {
				type: Sequelize.ENUM(
					"production",
					"economy",
					"special",
					"chance",
					"storage",
					"multiplier"
				),
				defaultValue: "production",
				allowNull: false,
			},
			icon: {
				type: Sequelize.STRING(3),
				defaultValue: "",
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
				comment: "Additional modifiers and effects of the upgrade",
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
				comment: "Conditions required to unlock or purchase the upgrade",
			},
			delayedUntil: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: "Timestamp until which the upgrade is delayed",
			},
			children: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				allowNull: false,
				comment: "Array of node names that are unlocked by this upgrade",
			},
			weight: {
				type: Sequelize.INTEGER,
				defaultValue: 1,
				allowNull: false,
				comment: "Weight/difficulty of the upgrade node",
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// 2. Создаем таблицу tasktemplates
		await queryInterface.createTable("tasktemplates", {
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
				comment: "Название задачи (заменяет title)",
			},
			labelKey: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: "Ключ для локализации",
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: false,
				comment: "Описание задачи (изменено с JSONB на TEXT)",
			},
			reward: {
				type: Sequelize.JSONB,
				defaultValue: { type: "stardust", amount: 0 },
				allowNull: false,
			},
			condition: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: "Condition for the task to be completed",
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
			isDaily: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
				comment: "Флаг для проверки ежедневных задач",
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// 3. Создаем таблицу eventtemplates
		await queryInterface.createTable("eventtemplates", {
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
					en: "",
					ru: "",
				},
				allowNull: false,
				comment: "Localized event descriptions",
			},
			type: {
				type: Sequelize.ENUM(
					"RANDOM",
					"PERIODIC",
					"ONE_TIME",
					"CONDITIONAL",
					"CHAINED",
					"TRIGGERED_BY_ACTION",
					"GLOBAL_TIMED",
					"LIMITED_REPEATABLE",
					"SEASONAL",
					"PASSIVE",
					"RESOURCE_BASED",
					"UPGRADE_DEPENDENT",
					"TASK_DEPENDENT",
					"MARKET_DEPENDENT",
					"MULTIPLAYER",
					"PROGRESSIVE",
					"TIERED"
				),
				allowNull: false,
			},
			triggerConfig: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: "Dynamic trigger logic depending on type",
			},
			effect: {
				type: Sequelize.JSONB,
				allowNull: false,
				comment: "Effect configuration (multiplier, duration, etc)",
			},
			frequency: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: "Frequency settings for RANDOM and PERIODIC events",
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: "Conditions that must be met for the event to trigger",
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// 4. Создаем таблицу packagetemplates
		await queryInterface.createTable("packagetemplates", {
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
			category: {
				type: Sequelize.STRING(50),
				allowNull: true,
				defaultValue: "resourcePurchase",
			},
			actionType: {
				type: Sequelize.STRING(50),
				allowNull: true,
				defaultValue: "fixedAmount",
			},
			actionTarget: {
				type: Sequelize.STRING(50),
				allowNull: true,
				defaultValue: "reward",
			},
			actionData: {
				type: Sequelize.JSONB,
				allowNull: true,
				defaultValue: {},
			},
			costData: {
				type: Sequelize.JSONB,
				allowNull: true,
				defaultValue: {},
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
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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
			CREATE INDEX IF NOT EXISTS tasktemplate_is_daily_idx ON tasktemplates ("isDaily");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS tasktemplate_label_key_idx ON tasktemplates ("labelKey");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS eventtemplate_slug_idx ON eventtemplates ("slug");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplate_slug_idx ON packagetemplates ("slug");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplate_category_idx ON packagetemplates ("category");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplate_action_type_idx ON packagetemplates ("actionType");
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем индексы
		await queryInterface.removeIndex(
			"packagetemplates",
			"packagetemplate_action_type_idx"
		);
		await queryInterface.removeIndex(
			"packagetemplates",
			"packagetemplate_category_idx"
		);
		await queryInterface.removeIndex(
			"packagetemplates",
			"packagetemplate_slug_idx"
		);
		await queryInterface.removeIndex("eventtemplates", "eventtemplate_slug_idx");
		await queryInterface.removeIndex(
			"tasktemplates",
			"tasktemplate_label_key_idx"
		);
		await queryInterface.removeIndex(
			"tasktemplates",
			"tasktemplate_is_daily_idx"
		);
		await queryInterface.removeIndex("tasktemplates", "tasktemplate_slug_idx");
		await queryInterface.removeIndex(
			"upgradenodetemplates",
			"upgradenodetemplate_slug_idx"
		);

		// Удаляем таблицы
		await queryInterface.dropTable("packagetemplates");
		await queryInterface.dropTable("eventtemplates");
		await queryInterface.dropTable("tasktemplates");
		await queryInterface.dropTable("upgradenodetemplates");
	},
};
