"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. View для статистики артефактов (ArtifactTemplate + user artifacts)
		await queryInterface.sequelize.query(`
			CREATE OR REPLACE VIEW artifact_statistics AS
			SELECT 
				at.id as template_id,
				at.slug,
				at.name,
				at.rarity,
				at."baseChance",
				at.active,
				COUNT(a.id) as total_owned,
				COUNT(CASE WHEN a.tradable = true THEN a.id END) as tradable_count,
				COUNT(CASE WHEN a.tradable = false THEN a.id END) as non_tradable_count,
				COUNT(CASE WHEN a."userId" IS NOT NULL THEN a.id END) as owned_by_users,
				COUNT(DISTINCT a."userId") as unique_owners
			FROM artifacttemplates at
			LEFT JOIN artifacts a ON at.id = a."artifactTemplateId"
			GROUP BY at.id, at.slug, at.name, at.rarity, at."baseChance", at.active
			ORDER BY at.rarity, at.name;
		`);

		// 2. View для активных событий пользователей (EventTemplate + user events)
		await queryInterface.sequelize.query(`
			CREATE OR REPLACE VIEW active_user_events AS
			SELECT 
				ue.id,
				ue."userId",
				u.username,
				et.id as template_id,
				et.name as event_name,
				et.type as event_type,
				et.active,
				ue.status,
				ue."triggeredAt",
				ue."expiresAt",
				ue.effects,
				ue.progress,
				CASE 
					WHEN ue."expiresAt" IS NOT NULL 
					THEN EXTRACT(EPOCH FROM (ue."expiresAt" - NOW())) / 3600
					ELSE NULL 
				END as hours_remaining
			FROM userevents ue
			JOIN users u ON ue."userId" = u.id
			JOIN eventtemplates et ON ue."eventTemplateId" = et.id
			WHERE ue.status = 'ACTIVE'
			AND (ue."expiresAt" IS NULL OR ue."expiresAt" > NOW())
			ORDER BY ue."triggeredAt" DESC;
		`);

		// 3. View для пользовательских прогрессов (UpgradeNodeTemplate + user upgrades)
		await queryInterface.sequelize.query(`
			CREATE OR REPLACE VIEW user_progress AS
			SELECT 
				u.id as user_id,
				u.username,
				uu."upgradeNodeTemplateId",
				unt.id as template_id,
				unt.name as upgrade_name,
				unt.category,
				unt.active,
				uu.level,
				uu.progress,
				uu."targetProgress",
				uu.completed,
				uu.stability,
				uu.instability,
				ROUND((uu.progress::DECIMAL / uu."targetProgress"::DECIMAL) * 100, 2) as progress_percentage
			FROM users u
			JOIN userupgrades uu ON u.id = uu."userId"
			JOIN upgradenodetemplates unt ON uu."upgradeNodeTemplateId" = unt.id
			WHERE uu.completed = false
			ORDER BY u.id, unt.category, unt.name;
		`);

		// 4. View для пользовательских задач (TaskTemplate + user tasks)
		await queryInterface.sequelize.query(`
			CREATE OR REPLACE VIEW user_tasks AS
			SELECT 
				ut.id,
				ut."userId",
				u.username,
				tt.slug as template_slug,
				tt.title as task_title,
				tt.active,
				ut.status,
				ut.active as task_active,
				ut."createdAt" as started_at,
				ut."completedAt"
			FROM usertasks ut
			JOIN users u ON ut."userId" = u.id
			JOIN tasktemplates tt ON ut."taskTemplateId" = tt.slug
			WHERE ut.status != 'completed'
			ORDER BY ut."createdAt" DESC;
		`);

		// 5. View для пользовательских пакетов (PackageTemplate + user packages)
		await queryInterface.sequelize.query(`
			CREATE OR REPLACE VIEW user_packages AS
			SELECT 
				ps.id,
				ps."userId",
				u.username,
				pt.id as template_id,
				pt.name as package_name,
				pt.status as active,
				ps.status,
				ps."createdAt" as purchased_at,
				-- Новые поля для гибкой структуры (только из шаблона)
				pt.category as template_category,
				pt."actionType" as template_action_type,
				pt."actionTarget" as template_action_target,
				pt."actionData" as template_action_data,
				pt."costData" as template_cost_data
			FROM packagestore ps
			JOIN users u ON ps."userId" = u.id
			JOIN packagetemplates pt ON ps."packageTemplateId" = pt.id
			WHERE ps.status = true
			ORDER BY ps."createdAt" DESC;
		`);

		// 6. View для статистики шаблонов (общая статистика по всем типам шаблонов)
		await queryInterface.sequelize.query(`
			CREATE OR REPLACE VIEW template_statistics AS
			SELECT 
				'artifact' as template_type,
				at.id::text as template_id,
				at.name::text as template_name,
				at.active,
				COUNT(a.id) as total_instances,
				COUNT(DISTINCT a."userId") as unique_users
			FROM artifacttemplates at
			LEFT JOIN artifacts a ON at.id = a."artifactTemplateId"
			GROUP BY at.id, at.name, at.active
			
			UNION ALL
			
			SELECT 
				'event' as template_type,
				et.id::text as template_id,
				et.name::text as template_name,
				et.active,
				COUNT(ue.id) as total_instances,
				COUNT(DISTINCT ue."userId") as unique_users
			FROM eventtemplates et
			LEFT JOIN userevents ue ON et.id = ue."eventTemplateId"
			GROUP BY et.id, et.name, et.active
			
			UNION ALL
			
			SELECT 
				'upgrade' as template_type,
				unt.id::text as template_id,
				unt.name::text as template_name,
				unt.active,
				COUNT(uu.id) as total_instances,
				COUNT(DISTINCT uu."userId") as unique_users
			FROM upgradenodetemplates unt
			LEFT JOIN userupgrades uu ON unt.id = uu."upgradeNodeTemplateId"
			GROUP BY unt.id, unt.name, unt.active
			
			UNION ALL
			
			SELECT
				'task' as template_type,
				tt.slug as template_id,
				tt.title->>'en' as template_name,
				tt.active,
				COUNT(ut.id) as total_instances,
				COUNT(DISTINCT ut."userId") as unique_users
			FROM tasktemplates tt
			LEFT JOIN usertasks ut ON tt.slug = ut."taskTemplateId"
			GROUP BY tt.slug, tt.title, tt.active
			
			UNION ALL
			
			SELECT
				'package' as template_type,
				pt.id::text as template_id,
				pt.name::text as template_name,
				pt.status as active,
				COUNT(ps.id) as total_instances,
				COUNT(DISTINCT ps."userId") as unique_users
			FROM packagetemplates pt
			LEFT JOIN packagestore ps ON pt.id = ps."packageTemplateId"
			GROUP BY pt.id, pt.name, pt.status
			
			ORDER BY template_type, template_name;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем все view
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS artifact_statistics CASCADE;"
		);
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS active_user_events CASCADE;"
		);
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS user_progress CASCADE;"
		);
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS user_tasks CASCADE;"
		);
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS user_packages CASCADE;"
		);
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS template_statistics CASCADE;"
		);
	},
};
