"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Удаляем представления, которые зависят от колонки taskTemplateId
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS user_tasks CASCADE;"
		);
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS template_statistics CASCADE;"
		);

		// Изменяем тип поля taskTemplateId с BIGINT на VARCHAR(50)
		await queryInterface.changeColumn("usertasks", "taskTemplateId", {
			type: Sequelize.STRING(50),
			allowNull: false,
		});

		// Пересоздаем представление user_tasks
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
				ut."completedAt" as completed_at,
				ut."updatedAt" as last_updated
			FROM usertasks ut
			JOIN users u ON ut."userId" = u.id
			JOIN tasktemplates tt ON ut."taskTemplateId" = tt.slug
			ORDER BY u.id, tt.slug;
		`);

		// Пересоздаем представление template_statistics
		await queryInterface.sequelize.query(`
			CREATE OR REPLACE VIEW template_statistics AS
			SELECT 
				tt.slug::text as template_id,
				tt.title->>'en'::text as template_name,
				tt.active,
				COUNT(ut.id) as total_users,
				COUNT(CASE WHEN ut.status = 'completed' THEN 1 END) as completed_count,
				COUNT(CASE WHEN ut.status = 'available' THEN 1 END) as available_count,
				COUNT(CASE WHEN ut.status = 'locked' THEN 1 END) as locked_count
			FROM tasktemplates tt
			LEFT JOIN usertasks ut ON tt.slug = ut."taskTemplateId"
			GROUP BY tt.slug, tt.title, tt.active;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем представление user_tasks
		await queryInterface.sequelize.query(
			"DROP VIEW IF EXISTS user_tasks CASCADE;"
		);

		// Возвращаем тип поля taskTemplateId обратно к BIGINT
		await queryInterface.changeColumn("usertasks", "taskTemplateId", {
			type: Sequelize.BIGINT,
			allowNull: false,
		});

		// Пересоздаем представление user_tasks с оригинальной структурой
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
				ut."completedAt" as completed_at,
				ut."updatedAt" as last_updated
			FROM usertasks ut
			JOIN users u ON ut."userId" = u.id
			JOIN tasktemplates tt ON ut."taskTemplateId" = tt.slug
			ORDER BY u.id, tt.slug;
		`);
	},
};
