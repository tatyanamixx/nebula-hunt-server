"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Дополнительные индексы для оптимизации запросов

		// Индексы для пользователей
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS users_role_idx ON users ("role");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS users_blocked_idx ON users ("blocked");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS users_created_at_idx ON users ("createdAt");
		`);

		// Индексы для состояний пользователей
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userstates_stardust_idx ON userstates ("stardust");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userstates_dark_matter_idx ON userstates ("darkMatter");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userstates_stars_idx ON userstates ("stars");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userstates_tg_stars_idx ON userstates ("tgStars");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userstates_ton_token_idx ON userstates ("tonToken");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userstates_last_daily_bonus_idx ON userstates ("lastDailyBonus");
		`);

		// Индексы для галактик
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS galaxies_active_idx ON galaxies ("active");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS galaxies_created_at_idx ON galaxies ("createdAt");
		`);

		// Индексы для артефактов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifacts_created_at_idx ON artifacts ("createdAt");
		`);

		// Индексы для шаблонов артефактов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifacttemplates_active_idx ON artifacttemplates ("active");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS artifacttemplates_base_chance_idx ON artifacttemplates ("baseChance");
		`);

		// Индексы для пользовательских апгрейдов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userupgrades_level_idx ON userupgrades ("level");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userupgrades_last_progress_update_idx ON userupgrades ("lastProgressUpdate");
		`);

		// Индексы для пользовательских задач
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usertasks_completed_at_idx ON usertasks ("completedAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usertasks_created_at_idx ON usertasks ("createdAt");
		`);

		// Индексы для пользовательских событий
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userevents_triggered_at_status_idx ON userevents ("triggeredAt", "status");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS userevents_expires_at_status_idx ON userevents ("expiresAt", "status");
		`);

		// Индексы для рыночных предложений
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffers_created_at_idx ON marketoffers ("createdAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffers_expires_at_idx ON marketoffers ("expiresAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffers_item_type_status_idx ON marketoffers ("itemType", "status");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffers_currency_status_idx ON marketoffers ("currency", "status");
		`);

		// Индексы для рыночных транзакций
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS markettransactions_created_at_idx ON markettransactions ("createdAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS markettransactions_completed_at_idx ON markettransactions ("completedAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS markettransactions_status_created_at_idx ON markettransactions ("status", "createdAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS paymenttransactions_confirmed_at_idx ON paymenttransactions ("confirmedAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS paymenttransactions_status_created_at_idx ON paymenttransactions ("status", "createdAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS paymenttransactions_currency_or_resource_idx ON paymenttransactions ("currencyOrResource");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagestore_is_used_idx ON packagestore ("isUsed");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagestore_created_at_idx ON packagestore ("createdAt");
		`);

		// Индексы для шаблонов пакетов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplates_status_idx ON packagetemplates ("status");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplates_is_promoted_idx ON packagetemplates ("isPromoted");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplates_valid_until_idx ON packagetemplates ("validUntil");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS packagetemplates_sort_order_idx ON packagetemplates ("sortOrder");
		`);

		// Индексы для шаблонов задач
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS tasktemplates_active_idx ON tasktemplates ("active");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS tasktemplates_sort_order_idx ON tasktemplates ("sortOrder");
		`);

		// Индексы для шаблонов событий
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS eventtemplates_active_idx ON eventtemplates ("active");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS eventtemplates_type_idx ON eventtemplates ("type");
		`);

		// Индексы для шаблонов апгрейдов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS upgradenodetemplates_active_idx ON upgradenodetemplates ("active");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS upgradenodetemplates_category_idx ON upgradenodetemplates ("category");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS upgradenodetemplates_currency_idx ON upgradenodetemplates ("currency");
		`);

		// Индексы для администраторов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admins_role_idx ON admins ("role");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admins_blocked_idx ON admins ("blocked");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admins_is_2fa_enabled_idx ON admins ("is_2fa_enabled");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admins_password_expires_at_idx ON admins ("passwordExpiresAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admins_last_login_at_idx ON admins ("lastLoginAt");
		`);

		// Индексы для приглашений администраторов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admininvites_used_idx ON admininvites ("used");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admininvites_expires_at_idx ON admininvites ("expiresAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS admininvites_token_idx ON admininvites ("token");
		`);

		// Составные индексы для оптимизации сложных запросов
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffers_status_item_type_created_at_idx ON marketoffers ("status", "itemType", "createdAt");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS usertasks_user_id_active_completed_idx ON usertasks ("userId", "active", "completed");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS galaxies_user_id_active_idx ON galaxies ("userId", "active");
		`);

		await queryInterface.addIndex(
			"paymenttransactions",
			["fromAccount", "status"],
			{
				name: "paymenttransactions_from_account_status_idx",
			}
		);

		await queryInterface.addIndex(
			"paymenttransactions",
			["toAccount", "status"],
			{
				name: "paymenttransactions_to_account_status_idx",
			}
		);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем составные индексы
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransactions_to_account_status_idx"
		);
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransactions_from_account_status_idx"
		);
		await queryInterface.removeIndex("galaxies", "galaxies_user_id_active_idx");
		await queryInterface.removeIndex(
			"artifacts",
			"artifacts_user_id_tradable_idx"
		);
		await queryInterface.removeIndex(
			"usertasks",
			"usertasks_user_id_active_completed_idx"
		);
		await queryInterface.removeIndex(
			"userupgrades",
			"userupgrades_user_id_completed_idx"
		);
		await queryInterface.removeIndex(
			"userevents",
			"userevents_user_id_status_expires_at_idx"
		);
		await queryInterface.removeIndex(
			"marketoffers",
			"marketoffers_status_item_type_created_at_idx"
		);

		// Удаляем индексы для приглашений администраторов
		await queryInterface.removeIndex("admininvites", "admininvites_token_idx");
		await queryInterface.removeIndex(
			"admininvites",
			"admininvites_expires_at_idx"
		);
		await queryInterface.removeIndex("admininvites", "admininvites_used_idx");

		// Удаляем индексы для администраторов
		await queryInterface.removeIndex("admins", "admins_last_login_at_idx");
		await queryInterface.removeIndex("admins", "admins_password_expires_at_idx");
		await queryInterface.removeIndex("admins", "admins_is_2fa_enabled_idx");
		await queryInterface.removeIndex("admins", "admins_blocked_idx");
		await queryInterface.removeIndex("admins", "admins_role_idx");

		// Удаляем индексы для шаблонов апгрейдов
		await queryInterface.removeIndex(
			"upgradenodetemplates",
			"upgradenodetemplates_currency_idx"
		);
		await queryInterface.removeIndex(
			"upgradenodetemplates",
			"upgradenodetemplates_category_idx"
		);
		await queryInterface.removeIndex(
			"upgradenodetemplates",
			"upgradenodetemplates_active_idx"
		);

		// Удаляем индексы для шаблонов событий
		await queryInterface.removeIndex(
			"eventtemplates",
			"eventtemplates_type_idx"
		);
		await queryInterface.removeIndex(
			"eventtemplates",
			"eventtemplates_active_idx"
		);

		// Удаляем индексы для шаблонов задач
		await queryInterface.removeIndex(
			"tasktemplates",
			"tasktemplates_sort_order_idx"
		);
		await queryInterface.removeIndex(
			"tasktemplates",
			"tasktemplates_active_idx"
		);

		// Удаляем индексы для шаблонов пакетов
		await queryInterface.removeIndex(
			"packagetemplates",
			"packagetemplates_sort_order_idx"
		);
		await queryInterface.removeIndex(
			"packagetemplates",
			"packagetemplates_valid_until_idx"
		);
		await queryInterface.removeIndex(
			"packagetemplates",
			"packagetemplates_is_promoted_idx"
		);
		await queryInterface.removeIndex(
			"packagetemplates",
			"packagetemplates_status_idx"
		);

		// Удаляем индексы для пакетов
		await queryInterface.removeIndex(
			"packagestore",
			"packagestore_created_at_idx"
		);

		await queryInterface.removeIndex("packagestore", "packagestore_is_used_idx");
		await queryInterface.removeIndex("packagestore", "packagestore_status_idx");

		// Удаляем индексы для платежных транзакций
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransactions_currency_or_resource_idx"
		);
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransactions_tx_type_idx"
		);
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransactions_status_created_at_idx"
		);
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransactions_confirmed_at_idx"
		);
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransactions_created_at_idx"
		);

		// Удаляем индексы для рыночных транзакций
		await queryInterface.removeIndex(
			"markettransactions",
			"markettransactions_status_created_at_idx"
		);
		await queryInterface.removeIndex(
			"markettransactions",
			"markettransactions_completed_at_idx"
		);
		await queryInterface.removeIndex(
			"markettransactions",
			"markettransactions_created_at_idx"
		);

		// Удаляем индексы для рыночных предложений
		await queryInterface.removeIndex(
			"marketoffers",
			"marketoffers_currency_status_idx"
		);
		await queryInterface.removeIndex(
			"marketoffers",
			"marketoffers_item_type_status_idx"
		);
		await queryInterface.removeIndex(
			"marketoffers",
			"marketoffers_expires_at_idx"
		);
		await queryInterface.removeIndex(
			"marketoffers",
			"marketoffers_created_at_idx"
		);

		// Удаляем индексы для пользовательских событий
		await queryInterface.removeIndex(
			"userevents",
			"userevents_expires_at_status_idx"
		);
		await queryInterface.removeIndex(
			"userevents",
			"userevents_triggered_at_status_idx"
		);

		// Удаляем индексы для пользовательских задач
		await queryInterface.removeIndex("usertasks", "usertasks_created_at_idx");
		await queryInterface.removeIndex("usertasks", "usertasks_completed_at_idx");

		// Удаляем индексы для пользовательских апгрейдов
		await queryInterface.removeIndex(
			"userupgrades",
			"userupgrades_last_progress_update_idx"
		);
		await queryInterface.removeIndex("userupgrades", "userupgrades_level_idx");

		// Удаляем индексы для шаблонов артефактов
		await queryInterface.removeIndex(
			"artifacttemplates",
			"artifacttemplates_base_chance_idx"
		);
		await queryInterface.removeIndex(
			"artifacttemplates",
			"artifacttemplates_active_idx"
		);

		// Удаляем индексы для артефактов
		await queryInterface.removeIndex("artifacts", "artifacts_created_at_idx");

		// Удаляем индексы для галактик
		await queryInterface.removeIndex("galaxies", "galaxies_created_at_idx");
		await queryInterface.removeIndex("galaxies", "galaxies_active_idx");

		// Удаляем индексы для состояний пользователей
		await queryInterface.removeIndex(
			"userstates",
			"userstates_last_daily_bonus_idx"
		);
		await queryInterface.removeIndex("userstates", "userstates_ton_token_idx");
		await queryInterface.removeIndex("userstates", "userstates_tg_stars_idx");
		await queryInterface.removeIndex("userstates", "userstates_stars_idx");
		await queryInterface.removeIndex("userstates", "userstates_dark_matter_idx");
		await queryInterface.removeIndex("userstates", "userstates_stardust_idx");

		// Удаляем индексы для пользователей
		await queryInterface.removeIndex("users", "users_created_at_idx");
		await queryInterface.removeIndex("users", "users_blocked_idx");
		await queryInterface.removeIndex("users", "users_role_idx");
	},
};
