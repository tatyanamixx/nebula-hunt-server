'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Активируем все отложенные ограничения
		await queryInterface.sequelize.query('SET CONSTRAINTS ALL IMMEDIATE;');

		// Создаем дополнительные проверки целостности данных

		// Примечание: userstates ресурсы (stardust, darkMatter, stars, tgStars, tonToken)
		// могут иметь отрицательные значения, поэтому не добавляем проверки на положительность

		// Проверка на положительные значения цен
		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE marketoffers 
				ADD CONSTRAINT check_positive_price 
				CHECK (price > 0);
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_positive_price already exists');
		}

		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE packagetemplates 
				ADD CONSTRAINT check_positive_package_price 
				CHECK (price > 0);
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log(
				'⚠️ Constraint check_positive_package_price already exists'
			);
		}

		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE paymenttransactions 
				ADD CONSTRAINT check_positive_amount 
				CHECK ("priceOrAmount" > 0);
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_positive_amount already exists');
		}

		// Проверка на корректные уровни апгрейдов
		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE userupgrades 
				ADD CONSTRAINT check_valid_level 
				CHECK (level >= 0 AND progress >= 0 AND "targetProgress" > 0);
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_valid_level already exists');
		}

		// Проверка на корректные значения шансов
		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE artifacttemplates 
				ADD CONSTRAINT check_base_chance_range 
				CHECK ("baseChance" >= 0.0 AND "baseChance" <= 1.0);
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_base_chance_range already exists');
		}

		// Проверка на корректные значения комиссий
		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE marketcommissions 
				ADD CONSTRAINT check_commission_rate 
				CHECK (rate >= 0.0 AND rate <= 1.0);
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_commission_rate already exists');
		}

		// Проверка на корректные даты
		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE userevents 
				ADD CONSTRAINT check_event_dates 
				CHECK ("triggeredAt" <= COALESCE("expiresAt", "triggeredAt"));
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_event_dates already exists');
		}

		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE admininvites 
				ADD CONSTRAINT check_invite_dates 
				CHECK ("expiresAt" > "createdAt");
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_invite_dates already exists');
		}

		// Проверка на корректные значения ENUM
		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE users 
				ADD CONSTRAINT check_valid_role 
				CHECK (role IN ('USER', 'SYSTEM'));
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_valid_role already exists');
		}

		try {
			await queryInterface.sequelize.query(`
				ALTER TABLE admins 
				ADD CONSTRAINT check_valid_admin_role 
				CHECK (role IN ('ADMIN', 'SUPERVISOR'));
			`);
		} catch (error) {
			if (!error.message.includes('already exists')) {
				throw error;
			}
			console.log('⚠️ Constraint check_valid_admin_role already exists');
		}

		// Создаем индексы для JSONB полей для оптимизации запросов
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_userstates_player_parameters ON userstates USING GIN ("playerParameters");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_userstates_player_parameters already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_userstates_last_bot_notification ON userstates USING GIN ("lastBotNotification");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_userstates_last_bot_notification already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_artifacts_effects ON artifacttemplates USING GIN (effects);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_artifacts_effects already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_upgrades_modifiers ON upgradenodetemplates USING GIN (modifiers);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_upgrades_modifiers already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_upgrades_conditions ON upgradenodetemplates USING GIN (conditions);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_upgrades_conditions already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_events_trigger_config ON eventtemplates USING GIN ("triggerConfig");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_events_trigger_config already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_events_effect ON eventtemplates USING GIN (effect);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_events_effect already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_events_frequency ON eventtemplates USING GIN (frequency);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_events_frequency already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_events_conditions ON eventtemplates USING GIN (conditions);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_events_conditions already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_userevents_effects ON userevents USING GIN (effects);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_userevents_effects already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_userevents_progress ON userevents USING GIN (progress);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_userevents_progress already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_usereventsettings_event_multipliers ON usereventsettings USING GIN ("eventMultipliers");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_usereventsettings_event_multipliers already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_usereventsettings_event_cooldowns ON usereventsettings USING GIN ("eventCooldowns");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_usereventsettings_event_cooldowns already exists or error:',
				error.message
			);
		}

		// Создаем частичные индексы для оптимизации
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_active_galaxies ON galaxies ("userId", "createdAt") WHERE active = true;
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_active_galaxies already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_tradable_artifacts ON artifacts ("userId", "createdAt") WHERE tradable = true;
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_tradable_artifacts already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_active_market_offers ON marketoffers ("itemType", currency, price) WHERE status = 'ACTIVE';
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_active_market_offers already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_completed_user_tasks ON usertasks ("userId", "completedAt") WHERE completed = true;
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_completed_user_tasks already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_active_user_events ON userevents ("userId", "expiresAt") WHERE status = 'ACTIVE';
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_active_user_events already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_confirmed_payments ON paymenttransactions ("txType", "currencyOrResource") WHERE status = 'CONFIRMED';
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_confirmed_payments already exists or error:',
				error.message
			);
		}

		// Создаем индексы для полнотекстового поиска
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_artifacts_name_search ON artifacts USING GIN (to_tsvector('english', name));
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_artifacts_name_search already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_artifact_templates_name_search ON artifacttemplates USING GIN (to_tsvector('english', name));
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_artifact_templates_name_search already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_upgrade_templates_name_search ON upgradenodetemplates USING GIN (to_tsvector('english', name));
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_upgrade_templates_name_search already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_task_templates_title_search ON tasktemplates USING GIN (to_tsvector('english', title->>'en'));
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_task_templates_title_search already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_event_templates_name_search ON eventtemplates USING GIN (to_tsvector('english', name));
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_event_templates_name_search already exists or error:',
				error.message
			);
		}

		// Создаем индексы для временных рядов
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_payment_transactions_time_series ON paymenttransactions ("createdAt", "txType", "currencyOrResource");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_payment_transactions_time_series already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_market_offers_time_series ON marketoffers ("createdAt", "itemType", status);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_market_offers_time_series already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_events_time_series ON userevents ("triggeredAt", status, "eventTemplateId");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_user_events_time_series already exists or error:',
				error.message
			);
		}

		// Создаем индексы для агрегации
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_resources_aggregation ON userstates (stardust, "darkMatter", stars, "tgStars");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_user_resources_aggregation already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_market_pricing_aggregation ON marketoffers ("itemType", currency, price, status);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_market_pricing_aggregation already exists or error:',
				error.message
			);
		}

		// Создаем индексы для уникальности
		try {
			await queryInterface.sequelize.query(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_event_settings ON usereventsettings ("userId");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_unique_user_event_settings already exists or error:',
				error.message
			);
		}

		try {
			await queryInterface.sequelize.query(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_state ON userstates ("userId");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_unique_user_state already exists or error:',
				error.message
			);
		}

		// Индексы для уникальности
		try {
			await queryInterface.sequelize.query(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_galaxy_seed ON galaxies (seed);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_unique_galaxy_seed already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_artifact_seed ON artifacts (seed);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_unique_artifact_seed already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_admin_invite_token ON admininvites (token);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_unique_admin_invite_token already exists or error:',
				error.message
			);
		}

		// Индексы для сортировки
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_package_templates_sort ON packagetemplates ("sortOrder", "status", "isPromoted");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_package_templates_sort already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_task_templates_sort ON tasktemplates ("sortOrder", active);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_task_templates_sort already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_artifact_templates_rarity_sort ON artifacttemplates (rarity, "baseChance", active);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_artifact_templates_rarity_sort already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_upgrade_templates_category_sort ON upgradenodetemplates (category, active, weight);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_upgrade_templates_category_sort already exists or error:',
				error.message
			);
		}

		// Индексы для фильтрации по датам
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_users_created_date ON users ("createdAt");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_users_created_date already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_artifacts_created_date ON artifacts ("createdAt");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_artifacts_created_date already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_galaxies_created_date ON galaxies ("createdAt");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_galaxies_created_date already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_market_offers_created_date ON marketoffers ("createdAt");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_market_offers_created_date already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_date ON paymenttransactions ("createdAt");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_payment_transactions_created_date already exists or error:',
				error.message
			);
		}

		// Индексы для поиска по диапазонам
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_market_offers_price_range ON marketoffers (price) WHERE status = 'ACTIVE';
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_market_offers_price_range already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_resources_range ON userstates (stardust, "darkMatter", stars);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_user_resources_range already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_upgrade_levels_range ON userupgrades (level, progress);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_upgrade_levels_range already exists or error:',
				error.message
			);
		}

		// Индексы для статистических запросов
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_payment_transactions_stats ON paymenttransactions (status, "txType", "createdAt");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_payment_transactions_stats already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_market_offers_stats ON marketoffers (status, "itemType", "createdAt");
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_market_offers_stats already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_activity_stats ON users ("createdAt", role);
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_user_activity_stats already exists or error:',
				error.message
			);
		}

		// Индексы для мониторинга
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_admin_password_expiry ON admins ("passwordExpiresAt") WHERE "passwordExpiresAt" IS NOT NULL;
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_admin_password_expiry already exists or error:',
				error.message
			);
		}
		try {
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_admin_last_login ON admins ("lastLoginAt") WHERE "lastLoginAt" IS NOT NULL;
			`);
		} catch (error) {
			console.log(
				'⚠️ Index idx_admin_last_login already exists or error:',
				error.message
			);
		}

		console.log(
			'✅ Все ограничения и индексы успешно созданы и активированы'
		);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем все созданные индексы
		const indexes = [
			'idx_userstates_player_parameters',
			'idx_userstates_last_bot_notification',
			'idx_artifacts_effects',
			'idx_upgrades_modifiers',
			'idx_upgrades_conditions',
			'idx_events_trigger_config',
			'idx_events_effect',
			'idx_events_frequency',
			'idx_events_conditions',
			'idx_userevents_effects',
			'idx_userevents_progress',
			'idx_usereventsettings_event_multipliers',
			'idx_usereventsettings_event_cooldowns',
			'idx_active_galaxies',
			'idx_tradable_artifacts',
			'idx_active_market_offers',
			'idx_completed_user_tasks',
			'idx_active_user_events',
			'idx_confirmed_payments',
			'idx_artifacts_name_search',
			'idx_artifact_templates_name_search',
			'idx_upgrade_templates_name_search',
			'idx_task_templates_title_search',
			'idx_event_templates_name_search',
			'idx_payment_transactions_time_series',
			'idx_market_offers_time_series',
			'idx_user_events_time_series',
			'idx_user_resources_aggregation',
			'idx_market_pricing_aggregation',
			'idx_unique_user_event_settings',
			'idx_unique_user_state',
			'idx_unique_galaxy_seed',
			'idx_unique_artifact_seed',
			'idx_unique_admin_invite_token',
			'idx_package_templates_sort',
			'idx_task_templates_sort',
			'idx_artifact_templates_rarity_sort',
			'idx_upgrade_templates_category_sort',
			'idx_users_created_date',
			'idx_artifacts_created_date',
			'idx_galaxies_created_date',
			'idx_market_offers_created_date',
			'idx_payment_transactions_created_date',
			'idx_market_offers_price_range',
			'idx_user_resources_range',
			'idx_upgrade_levels_range',
			'idx_payment_transactions_stats',
			'idx_market_offers_stats',
			'idx_user_activity_stats',
			'idx_admin_password_expiry',
			'idx_admin_last_login',
			'idx_user_events_expiry',
			'idx_market_offers_expiry',
			'idx_admin_invites_expiry',
			'idx_blocked_users',
			'idx_blocked_admins',
			'idx_failed_payments',
			'idx_cancelled_market_offers',
		];

		for (const indexName of indexes) {
			try {
				await queryInterface.sequelize.query(
					`DROP INDEX IF EXISTS ${indexName} CASCADE;`
				);
			} catch (error) {
				console.log(
					`⚠️ Не удалось удалить индекс ${indexName}:`,
					error.message
				);
			}
		}

		// Удаляем проверки целостности
		const constraints = [
			'check_positive_price',
			'check_positive_package_price',
			'check_positive_amount',
			'check_valid_level',
			'check_stability_range',
			'check_base_chance_range',
			'check_commission_rate',
			'check_event_dates',
			'check_invite_dates',
			'check_valid_role',
			'check_valid_admin_role',
		];

		for (const constraintName of constraints) {
			try {
				await queryInterface.sequelize.query(
					`ALTER TABLE ${
						constraintName.split('_')[1]
					}s DROP CONSTRAINT IF EXISTS ${constraintName} CASCADE;`
				);
			} catch (error) {
				console.log(
					`⚠️ Не удалось удалить ограничение ${constraintName}:`,
					error.message
				);
			}
		}

		console.log('✅ Все индексы и ограничения успешно удалены');
	},
};
