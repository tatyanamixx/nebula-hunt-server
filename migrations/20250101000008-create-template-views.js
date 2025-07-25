/**
 * Миграция для создания view связок template-ребенок
 *
 * Эта миграция создает view, которые объединяют таблицы шаблонов с таблицами
 * пользовательских данных, чтобы ребенок имел доступ к свойствам template
 */

'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			console.log('Создаем view для связок template-ребенок...');

			// View для апгрейдов пользователя с данными шаблона
			await queryInterface.sequelize.query(`
				CREATE OR REPLACE VIEW user_upgrades_with_template AS
				SELECT 
					uu.id,
					uu."userId",
					uu."upgradeNodeTemplateId",
					uu.level,
					uu.progress,
					uu."targetProgress",
					uu.completed,
					uu."progressHistory",
					uu."lastProgressUpdate",
					uu."createdAt",
					uu."updatedAt",
					-- Данные из шаблона
					unt.slug as "templateSlug",
					unt.name as "templateName",
					unt.description as "templateDescription",
					unt."maxLevel" as "templateMaxLevel",
					unt."basePrice" as "templateBasePrice",
					unt."effectPerLevel" as "templateEffectPerLevel",
					unt."priceMultiplier" as "templatePriceMultiplier",
					unt.currency as "templateCurrency",
					unt.category as "templateCategory",
					unt.icon as "templateIcon",
					unt.stability as "templateStability",
					unt.instability as "templateInstability",
					unt.modifiers as "templateModifiers",
					unt.conditions as "templateConditions",
					unt.children as "templateChildren",
					unt.weight as "templateWeight",
					unt.active as "templateActive",
					unt."delayedUntil" as "templateDelayedUntil"
				FROM userupgrades uu
				LEFT JOIN upgradenodetemplates unt ON uu."upgradeNodeTemplateId" = unt.id
			`);

			// View для задач пользователя с данными шаблона
			await queryInterface.sequelize.query(`
				CREATE OR REPLACE VIEW user_tasks_with_template AS
				SELECT 
					ut.id,
					ut."userId",
					ut."taskTemplateId",
					ut.completed,
					ut.reward,
					ut.active,
					ut."completedAt",
					ut."createdAt",
					ut."updatedAt",
					-- Данные из шаблона
					tt.slug as "templateSlug",
					tt.title as "templateTitle",
					tt.description as "templateDescription",
					tt.reward as "templateReward",
					tt.condition as "templateCondition",
					tt.icon as "templateIcon",
					tt.active as "templateActive"
				FROM usertasks ut
				LEFT JOIN tasktemplates tt ON ut."taskTemplateId" = tt.id
			`);

			// View для событий пользователя с данными шаблона
			await queryInterface.sequelize.query(`
				CREATE OR REPLACE VIEW user_events_with_template AS
				SELECT 
					ue.id,
					ue."userId",
					ue."eventTemplateId",
					ue.status,
					ue."triggeredAt",
					ue."expiresAt",
					ue.effects,
					ue.progress,
					ue."completedAt",
					ue."createdAt",
					ue."updatedAt",
					-- Данные из шаблона
					et.slug as "templateSlug",
					et.name as "templateName",
					et.description as "templateDescription",
					et.type as "templateType",
					et."triggerConfig" as "templateTriggerConfig",
					et.effect as "templateEffect",
					et.frequency as "templateFrequency",
					et.conditions as "templateConditions",
					et.active as "templateActive"
				FROM userevents ue
				LEFT JOIN eventtemplates et ON ue."eventTemplateId" = et.id
			`);

			// View для пакетов пользователя с данными шаблона
			await queryInterface.sequelize.query(`
				CREATE OR REPLACE VIEW user_packages_with_template AS
				SELECT 
					ps.id,
					ps."userId",
					ps."packageTemplateId",
					ps.amount,
					ps.resource,
					ps.price,
					ps.currency,
					ps.status,
					ps."isUsed",
					ps."isLocked",
					ps."createdAt",
					ps."updatedAt",
					-- Данные из шаблона
					pt.slug as "templateSlug",
					pt.name as "templateName",
					pt.description as "templateDescription",
					pt.amount as "templateAmount",
					pt.resource as "templateResource",
					pt.price as "templatePrice",
					pt.currency as "templateCurrency",
					pt.status as "templateStatus",
					pt."imageUrl" as "templateImageUrl",
					pt."sortOrder" as "templateSortOrder",
					pt.category as "templateCategory",
					pt."isPromoted" as "templateIsPromoted",
					pt."validUntil" as "templateValidUntil"
				FROM packagestores ps
				LEFT JOIN packagetemplates pt ON ps."packageTemplateId" = pt.id
			`);

			// View для артифактов пользователя с данными шаблона
			await queryInterface.sequelize.query(`
				CREATE OR REPLACE VIEW user_artifacts_with_template AS
				SELECT 
					a.id,
					a."userId",
					a."artifactTemplateId",
					a.seed,
					a.name,
					a.description,
					a.tradable,
					a."createdAt",
					a."updatedAt",
					-- Данные из шаблона
					at.slug as "templateSlug",
					at.name as "templateName",
					at.description as "templateDescription",
					at.rarity as "templateRarity",
					at.image as "templateImage",
					at.effects as "templateEffects",
					at.limited as "templateLimited",
					at."limitedCount" as "templateLimitedCount",
					at."limitedDuration" as "templateLimitedDuration",
					at."limitedDurationType" as "templateLimitedDurationType",
					at."limitedDurationValue" as "templateLimitedDurationValue"
				FROM artifacts a
				LEFT JOIN artifacttemplates at ON a."artifactTemplateId" = at.id
			`);

			// Создаем индексы для оптимизации view
			console.log('Создаем индексы для оптимизации view...');

			// Индексы для user_upgrades_with_template
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_upgrades_with_template_user_id 
				ON userupgrades("userId")
			`);

			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_upgrades_with_template_template_id 
				ON userupgrades("upgradeNodeTemplateId")
			`);

			// Индексы для user_tasks_with_template
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_tasks_with_template_user_id 
				ON usertasks("userId")
			`);

			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_tasks_with_template_template_id 
				ON usertasks("taskTemplateId")
			`);

			// Индексы для user_events_with_template
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_events_with_template_user_id 
				ON userevents("userId")
			`);

			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_events_with_template_template_id 
				ON userevents("eventTemplateId")
			`);

			// Индексы для user_packages_with_template
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_packages_with_template_user_id 
				ON packagestores("userId")
			`);

			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_packages_with_template_template_id 
				ON packagestores("packageTemplateId")
			`);

			// Индексы для user_artifacts_with_template
			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_artifacts_with_template_user_id 
				ON artifacts("userId")
			`);

			await queryInterface.sequelize.query(`
				CREATE INDEX IF NOT EXISTS idx_user_artifacts_with_template_template_id 
				ON artifacts("artifactTemplateId")
			`);

			console.log('View для связок template-ребенок успешно созданы');
		} catch (error) {
			console.error('Ошибка при создании view:', error);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			console.log('Удаляем view для связок template-ребенок...');

			// Удаляем view
			await queryInterface.sequelize.query(`
				DROP VIEW IF EXISTS user_upgrades_with_template
			`);

			await queryInterface.sequelize.query(`
				DROP VIEW IF EXISTS user_tasks_with_template
			`);

			await queryInterface.sequelize.query(`
				DROP VIEW IF EXISTS user_events_with_template
			`);

			await queryInterface.sequelize.query(`
				DROP VIEW IF EXISTS user_packages_with_template
			`);

			await queryInterface.sequelize.query(`
				DROP VIEW IF EXISTS user_artifacts_with_template
			`);

			// Удаляем индексы
			console.log('Удаляем индексы...');

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_upgrades_with_template_user_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_upgrades_with_template_template_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_tasks_with_template_user_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_tasks_with_template_template_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_events_with_template_user_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_events_with_template_template_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_packages_with_template_user_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_packages_with_template_template_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_artifacts_with_template_user_id
			`);

			await queryInterface.sequelize.query(`
				DROP INDEX IF EXISTS idx_user_artifacts_with_template_template_id
			`);

			console.log('View для связок template-ребенок успешно удалены');
		} catch (error) {
			console.error('Ошибка при удалении view:', error);
			throw error;
		}
	},
};
