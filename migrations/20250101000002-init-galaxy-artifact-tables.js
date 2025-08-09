"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу galaxies
		await queryInterface.createTable("galaxies", {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},

			// === ОСНОВНЫЕ ПОЛЯ ===
			name: {
				type: Sequelize.STRING(255),
				allowNull: true,
				comment: "Автогенерируемое имя галактики",
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},

			// === ЗВЕЗДЫ И РЕСУРСЫ ===
			starMin: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			starCurrent: {
				type: Sequelize.INTEGER,
				defaultValue: 1000,
				allowNull: false,
				comment:
					"Текущее количество звезд (синхронизировано с client.stars)",
			},
			maxStars: {
				type: Sequelize.INTEGER,
				defaultValue: 100000,
				allowNull: false,
				comment: "Максимальное количество звезд для галактики",
			},

			// === ВРЕМЕННЫЕ МЕТКИ ===
			birthDate: {
				type: Sequelize.DATEONLY,
				allowNull: true,
				comment: "Дата создания галактики",
			},
			lastCollectTime: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
				allowNull: false,
				comment: "Время последнего сбора ресурсов",
			},

			// === ВИЗУАЛЬНЫЕ СВОЙСТВА ===
			galaxyType: {
				type: Sequelize.STRING(50),
				allowNull: true,
				comment: "Тип галактики: spiral, elliptical, irregular, etc.",
			},
			colorPalette: {
				type: Sequelize.STRING(50),
				allowNull: true,
				comment: "Цветовая схема: nebula, aurora, cosmic, etc.",
			},
			backgroundType: {
				type: Sequelize.STRING(50),
				allowNull: true,
				comment: "Тип фона галактики",
			},

			// === ИГРОВЫЕ ПАРАМЕТРЫ ===
			price: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			particleCount: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			onParticleCountChange: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},

			// === ДОПОЛНИТЕЛЬНЫЕ СВОЙСТВА ===
			galaxyProperties: {
				type: Sequelize.JSONB,
				allowNull: true,
				comment: "Дополнительные свойства в JSON формате",
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

		// 2. Создаем таблицу artifacttemplates
		await queryInterface.createTable("artifacttemplates", {
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
				comment: "Localized artifact descriptions",
			},
			rarity: {
				type: Sequelize.ENUM(
					"COMMON",
					"UNCOMMON",
					"RARE",
					"EPIC",
					"LEGENDARY"
				),
				defaultValue: "COMMON",
				allowNull: false,
			},
			image: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			effects: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: "Например: { chaos: 0.1, stability: -0.2 }",
			},
			limited: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			limitedCount: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			limitedDuration: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			limitedDurationType: {
				type: Sequelize.ENUM("HOUR", "DAY", "WEEK", "MONTH", "YEAR"),
				defaultValue: "HOUR",
				allowNull: false,
			},
			limitedDurationValue: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			baseChance: {
				type: Sequelize.FLOAT,
				defaultValue: 0.01,
				allowNull: false,
				comment: "Base chance for this artifact to be found (0.0 to 1.0)",
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

		// 3. Создаем таблицу artifacts
		await queryInterface.createTable("artifacts", {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			artifactTemplateId: {
				type: Sequelize.BIGINT,
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
			tradable: {
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

		// Создаем индексы для galaxies
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS galaxy_seed_idx ON galaxies ("seed");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS galaxy_user_id_idx ON galaxies ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS galaxy_type_idx ON galaxies ("galaxyType");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS galaxy_last_collect_idx ON galaxies ("lastCollectTime");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifacttemplate_slug_idx ON artifacttemplates ("slug");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifacttemplate_rarity_idx ON artifacttemplates ("rarity");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifacttemplate_limited_idx ON artifacttemplates ("limited");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifact_user_id_idx ON artifacts ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifact_artifact_template_id_idx ON artifacts ("artifactTemplateId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifact_seed_idx ON artifacts ("seed");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifact_tradable_idx ON artifacts ("tradable");
		`);

		// Создаем отложенные внешние ключи через raw SQL
		await queryInterface.sequelize.query(`
			ALTER TABLE galaxies 
			ADD CONSTRAINT galaxies_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE artifacts 
			ADD CONSTRAINT artifacts_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE artifacts 
			ADD CONSTRAINT artifacts_artifact_template_id_fkey 
			FOREIGN KEY ("artifactTemplateId") 
			REFERENCES artifacttemplates(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем отложенные ограничения
		await queryInterface.removeConstraint(
			"artifacts",
			"artifacts_artifact_template_id_fkey"
		);
		await queryInterface.removeConstraint("artifacts", "artifacts_user_id_fkey");
		await queryInterface.removeConstraint("galaxies", "galaxies_user_id_fkey");

		// Удаляем индексы
		await queryInterface.removeIndex("artifacts", "artifact_tradable_idx");
		await queryInterface.removeIndex("artifacts", "artifact_seed_idx");
		await queryInterface.removeIndex(
			"artifacts",
			"artifact_artifact_template_id_idx"
		);
		await queryInterface.removeIndex("artifacts", "artifact_user_id_idx");
		await queryInterface.removeIndex(
			"artifacttemplates",
			"artifacttemplate_limited_idx"
		);
		await queryInterface.removeIndex(
			"artifacttemplates",
			"artifacttemplate_rarity_idx"
		);
		await queryInterface.removeIndex(
			"artifacttemplates",
			"artifacttemplate_slug_idx"
		);
		await queryInterface.removeIndex("galaxies", "galaxy_user_id_idx");
		await queryInterface.removeIndex("galaxies", "galaxy_seed_idx");
		await queryInterface.removeIndex("galaxies", "galaxy_type_idx");
		await queryInterface.removeIndex("galaxies", "galaxy_last_collect_idx");

		// Удаляем таблицы
		await queryInterface.dropTable("artifacts");
		await queryInterface.dropTable("artifacttemplates");
		await queryInterface.dropTable("galaxies");
	},
};
