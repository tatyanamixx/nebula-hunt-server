'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу userupgrades
		await queryInterface.createTable('userupgrades', {
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
			upgradeNodeTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			level: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			progress: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			targetProgress: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			completed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			progressHistory: {
				type: Sequelize.JSONB,
				defaultValue: [],
				allowNull: false,
			},
			lastProgressUpdate: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

		// 2. Создаем таблицу usertasks
		await queryInterface.createTable('usertasks', {
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
			taskTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			completed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			reward: {
				type: Sequelize.JSONB,
				defaultValue: { type: 'stardust', amount: 0 },
				allowNull: false,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			completedAt: {
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

		// 3. Создаем таблицу userevents
		await queryInterface.createTable('userevents', {
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
			eventTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM(
					'ACTIVE',
					'EXPIRED',
					'COMPLETED',
					'CANCELLED'
				),
				defaultValue: 'ACTIVE',
				allowNull: false,
			},
			triggeredAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				allowNull: false,
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			effects: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: 'Эффекты события (множители и т.д.)',
			},
			progress: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: 'Прогресс выполнения события',
			},
			completedAt: {
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

		// 4. Создаем таблицу usereventsettings
		await queryInterface.createTable('usereventsettings', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				unique: true,
				allowNull: false,
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
				allowNull: false,
				comment: 'Текущие активные множители от событий',
			},
			lastEventCheck: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				allowNull: false,
				comment: 'Последнее время проверки событий',
			},
			eventCooldowns: {
				type: Sequelize.JSONB,
				defaultValue: {},
				allowNull: false,
				comment: 'Кулдауны для разных типов событий',
			},
			enabledTypes: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: ['RANDOM', 'PERIODIC', 'CONDITIONAL'],
				allowNull: false,
				comment: 'Включенные типы событий',
			},
			disabledEvents: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				allowNull: false,
				comment: 'Отключенные конкретные события',
			},
			priorityEvents: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				allowNull: false,
				comment: 'Приоритетные события',
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

		// 5. Создаем таблицу packagestore
		await queryInterface.createTable('packagestore', {
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
			packageTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
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
			CREATE INDEX IF NOT EXISTS userupgrades_user_id_idx ON userupgrades ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userupgrades_upgrade_node_template_id_idx ON userupgrades ("upgradeNodeTemplateId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usertasks_user_id_idx ON usertasks ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usertasks_task_template_id_idx ON usertasks ("taskTemplateId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usertasks_completed_idx ON usertasks ("completed");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usertasks_active_idx ON usertasks ("active");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userevents_user_id_idx ON userevents ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userevents_event_template_id_idx ON userevents ("eventTemplateId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userevents_status_idx ON userevents ("status");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userevents_expires_at_idx ON userevents ("expiresAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userevents_triggered_at_idx ON userevents ("triggeredAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usereventsettings_user_id_idx ON usereventsettings ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagestore_user_id_idx ON packagestore ("userId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagestore_package_template_id_idx ON packagestore ("packageTemplateId");
		`);

		// Создаем отложенные внешние ключи
		await queryInterface.sequelize.query(`
			ALTER TABLE userupgrades 
			ADD CONSTRAINT userupgrades_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE userupgrades 
			ADD CONSTRAINT userupgrades_upgrade_node_template_id_fkey 
			FOREIGN KEY ("upgradeNodeTemplateId") 
			REFERENCES upgradenodetemplates(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE usertasks 
			ADD CONSTRAINT usertasks_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE usertasks 
			ADD CONSTRAINT usertasks_task_template_id_fkey 
			FOREIGN KEY ("taskTemplateId") 
			REFERENCES tasktemplates(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE userevents 
			ADD CONSTRAINT userevents_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE userevents 
			ADD CONSTRAINT userevents_event_template_id_fkey 
			FOREIGN KEY ("eventTemplateId") 
			REFERENCES eventtemplates(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE usereventsettings 
			ADD CONSTRAINT usereventsettings_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE packagestore 
			ADD CONSTRAINT packagestore_user_id_fkey 
			FOREIGN KEY ("userId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE packagestore 
			ADD CONSTRAINT packagestore_package_template_id_fkey 
			FOREIGN KEY ("packageTemplateId") 
			REFERENCES packagetemplates(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем отложенные ограничения
		await queryInterface.removeConstraint(
			'packagestore',
			'packagestore_package_template_id_fkey'
		);
		await queryInterface.removeConstraint(
			'packagestore',
			'packagestore_user_id_fkey'
		);
		await queryInterface.removeConstraint(
			'usereventsettings',
			'usereventsettings_user_id_fkey'
		);
		await queryInterface.removeConstraint(
			'userevents',
			'userevents_event_template_id_fkey'
		);
		await queryInterface.removeConstraint(
			'userevents',
			'userevents_user_id_fkey'
		);
		await queryInterface.removeConstraint(
			'usertasks',
			'usertasks_task_template_id_fkey'
		);
		await queryInterface.removeConstraint(
			'usertasks',
			'usertasks_user_id_fkey'
		);
		await queryInterface.removeConstraint(
			'userupgrades',
			'userupgrades_upgrade_node_template_id_fkey'
		);
		await queryInterface.removeConstraint(
			'userupgrades',
			'userupgrades_user_id_fkey'
		);

		// Удаляем индексы
		await queryInterface.removeIndex(
			'packagestore',
			'packagestore_package_template_id_idx'
		);
		await queryInterface.removeIndex(
			'packagestore',
			'packagestore_user_id_idx'
		);
		await queryInterface.removeIndex(
			'usereventsettings',
			'usereventsettings_user_id_idx'
		);
		await queryInterface.removeIndex(
			'userevents',
			'userevents_triggered_at_idx'
		);
		await queryInterface.removeIndex(
			'userevents',
			'userevents_expires_at_idx'
		);
		await queryInterface.removeIndex('userevents', 'userevents_status_idx');
		await queryInterface.removeIndex(
			'userevents',
			'userevents_event_template_id_idx'
		);
		await queryInterface.removeIndex(
			'userevents',
			'userevents_user_id_idx'
		);
		await queryInterface.removeIndex('usertasks', 'usertasks_active_idx');
		await queryInterface.removeIndex(
			'usertasks',
			'usertasks_completed_idx'
		);
		await queryInterface.removeIndex(
			'usertasks',
			'usertasks_task_template_id_idx'
		);
		await queryInterface.removeIndex('usertasks', 'usertasks_user_id_idx');
		await queryInterface.removeIndex(
			'userupgrades',
			'userupgrades_completed_idx'
		);
		await queryInterface.removeIndex(
			'userupgrades',
			'userupgrades_upgrade_node_template_id_idx'
		);
		await queryInterface.removeIndex(
			'userupgrades',
			'userupgrades_user_id_idx'
		);

		// Удаляем таблицы
		await queryInterface.dropTable('packagestore');
		await queryInterface.dropTable('usereventsettings');
		await queryInterface.dropTable('userevents');
		await queryInterface.dropTable('usertasks');
		await queryInterface.dropTable('userupgrades');
	},
};
