"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const transaction = await queryInterface.sequelize.transaction();

		try {
			// 1. Удаляем зависимые views
			await queryInterface.sequelize.query(
				`DROP VIEW IF EXISTS user_progress CASCADE;`,
				{ transaction }
			);

			// 2. Добавляем новую колонку upgradeTemplateSlug
			await queryInterface.addColumn(
				"userupgrades",
				"upgradeTemplateSlug",
				{
					type: Sequelize.STRING(50),
					allowNull: true, // Временно разрешаем NULL
					comment: "Slug identifier for upgrade template",
				},
				{ transaction }
			);

			// 3. Мигрируем данные: копируем slug из upgradenodetemplates
			await queryInterface.sequelize.query(
				`
				UPDATE userupgrades 
				SET "upgradeTemplateSlug" = upgradenodetemplates.slug
				FROM upgradenodetemplates
				WHERE userupgrades."upgradeNodeTemplateId" = upgradenodetemplates.id
				`,
				{ transaction }
			);

			// 4. Делаем upgradeTemplateSlug NOT NULL после миграции данных
			await queryInterface.changeColumn(
				"userupgrades",
				"upgradeTemplateSlug",
				{
					type: Sequelize.STRING(50),
					allowNull: false,
					comment: "Slug identifier for upgrade template",
				},
				{ transaction }
			);

			// 5. Удаляем старый индекс
			await queryInterface.removeIndex(
				"userupgrades",
				"userupgrades_upgrade_node_template_id_idx",
				{ transaction }
			);

			// 6. Удаляем старую колонку upgradeNodeTemplateId
			await queryInterface.removeColumn(
				"userupgrades",
				"upgradeNodeTemplateId",
				{ transaction }
			);

			// 7. Создаем новый индекс на upgradeTemplateSlug
			await queryInterface.addIndex("userupgrades", ["upgradeTemplateSlug"], {
				name: "userupgrades_upgrade_template_slug_idx",
				transaction,
			});

			// 8. Создаем уникальный составной индекс (userId + upgradeTemplateSlug)
			await queryInterface.addIndex(
				"userupgrades",
				["userId", "upgradeTemplateSlug"],
				{
					unique: true,
					name: "userupgrades_user_upgrade_unique_idx",
					transaction,
				}
			);

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		const transaction = await queryInterface.sequelize.transaction();

		try {
			// 1. Добавляем обратно upgradeNodeTemplateId
			await queryInterface.addColumn(
				"userupgrades",
				"upgradeNodeTemplateId",
				{
					type: Sequelize.BIGINT,
					allowNull: true,
					field: "upgradeNodeTemplateId",
				},
				{ transaction }
			);

			// 2. Восстанавливаем данные
			await queryInterface.sequelize.query(
				`
				UPDATE userupgrades 
				SET "upgradeNodeTemplateId" = upgradenodetemplates.id
				FROM upgradenodetemplates
				WHERE userupgrades."upgradeTemplateSlug" = upgradenodetemplates.slug
				`,
				{ transaction }
			);

			// 3. Делаем upgradeNodeTemplateId NOT NULL
			await queryInterface.changeColumn(
				"userupgrades",
				"upgradeNodeTemplateId",
				{
					type: Sequelize.BIGINT,
					allowNull: false,
					field: "upgradeNodeTemplateId",
				},
				{ transaction }
			);

			// 4. Удаляем новые индексы
			await queryInterface.removeIndex(
				"userupgrades",
				"userupgrades_user_upgrade_unique_idx",
				{ transaction }
			);
			await queryInterface.removeIndex(
				"userupgrades",
				"userupgrades_upgrade_template_slug_idx",
				{ transaction }
			);

			// 5. Удаляем upgradeTemplateSlug
			await queryInterface.removeColumn(
				"userupgrades",
				"upgradeTemplateSlug",
				{ transaction }
			);

			// 6. Восстанавливаем старый индекс
			await queryInterface.addIndex(
				"userupgrades",
				["upgradeNodeTemplateId"],
				{
					name: "userupgrades_upgrade_node_template_id_idx",
					transaction,
				}
			);

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	},
};
