"use strict";

module.exports = {
	async up(queryInterface, Sequelize) {
		// Заменяем все дефисы на подчеркивания в slug
		await queryInterface.sequelize.query(`
			UPDATE tasktemplates 
			SET slug = REPLACE(slug, '-', '_')
			WHERE slug LIKE '%-%';
		`);

		console.log(
			"✅ Fixed task template slugs: replaced hyphens with underscores"
		);
	},

	async down(queryInterface, Sequelize) {
		// Возвращаем подчеркивания обратно к дефисам
		await queryInterface.sequelize.query(`
			UPDATE tasktemplates 
			SET slug = REPLACE(slug, '_', '-')
			WHERE slug LIKE '%_%';
		`);

		console.log(
			"🔄 Reverted task template slugs: replaced underscores with hyphens"
		);
	},
};
