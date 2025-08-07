"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Получаем следующий доступный ID
		const result = await queryInterface.sequelize.query(
			"SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM tasktemplates",
			{ type: Sequelize.QueryTypes.SELECT }
		);
		const nextId = parseInt(result?.nextId) || 1;

		// Task templates based on the real game data
		await queryInterface.bulkInsert(
			"tasktemplates",
			[
				// DAILY TASKS
				{
					id: nextId,
					slug: "daily_login",
					title: JSON.stringify({
						en: "Daily Explorer",
						ru: "Ежедневный исследователь",
					}),
					description: JSON.stringify({
						en: "Login daily to receive rewards",
						ru: "Входите ежедневно для получения наград",
					}),
					reward: JSON.stringify({
						type: "daily_login",
					}),
					condition: JSON.stringify({
						type: "daily_login",
					}),
					icon: "📆",
					active: true,
					sortOrder: 1,
					category: "daily",
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// STARDUST TASKS
				{
					id: nextId + 1,
					slug: "create_stars_100",
					title: JSON.stringify({
						en: "First Steps",
						ru: "Первые шаги",
					}),
					description: JSON.stringify({
						en: "Create 100 stars",
						ru: "Создайте 100 звезд",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 500,
					}),
					condition: JSON.stringify({
						type: "total_stars",
						threshold: 100,
					}),
					icon: "⭐",
					active: true,
					sortOrder: 1,
					category: "stardust",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 2,
					slug: "create_stars_1000",
					title: JSON.stringify({
						en: "Star Crafter",
						ru: "Создатель звезд",
					}),
					description: JSON.stringify({
						en: "Create 1,000 stars",
						ru: "Создайте 1,000 звезд",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 2000,
					}),
					condition: JSON.stringify({
						type: "total_stars",
						threshold: 1000,
					}),
					icon: "⭐",
					active: true,
					sortOrder: 2,
					category: "stardust",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 3,
					slug: "create_stars_10000",
					title: JSON.stringify({
						en: "Stellar Engineer",
						ru: "Звездный инженер",
					}),
					description: JSON.stringify({
						en: "Create 10,000 stars",
						ru: "Создайте 10,000 звезд",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 10000,
					}),
					condition: JSON.stringify({
						type: "total_stars",
						threshold: 10000,
					}),
					icon: "⭐",
					active: true,
					sortOrder: 3,
					category: "stardust",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 4,
					slug: "create_stars_25000",
					title: JSON.stringify({
						en: "Star Architect",
						ru: "Звездный архитектор",
					}),
					description: JSON.stringify({
						en: "Create 25,000 stars",
						ru: "Создайте 25,000 звезд",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 15000,
					}),
					condition: JSON.stringify({
						type: "total_stars",
						threshold: 25000,
					}),
					icon: "⭐",
					active: true,
					sortOrder: 4,
					category: "stardust",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 5,
					slug: "collect_stardust_5000",
					title: JSON.stringify({
						en: "Dust Collector",
						ru: "Сборщик пыли",
					}),
					description: JSON.stringify({
						en: "Collect 5,000 stardust",
						ru: "Соберите 5,000 звездной пыли",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 1000,
					}),
					condition: JSON.stringify({
						type: "total_stardust",
						threshold: 5000,
					}),
					icon: "✨",
					active: true,
					sortOrder: 1,
					category: "collection",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 6,
					slug: "collect_stardust_50000",
					title: JSON.stringify({
						en: "Dust Master",
						ru: "Мастер пыли",
					}),
					description: JSON.stringify({
						en: "Collect 50,000 stardust",
						ru: "Соберите 50,000 звездной пыли",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 5000,
					}),
					condition: JSON.stringify({
						type: "total_stardust",
						threshold: 50000,
					}),
					icon: "✨",
					active: true,
					sortOrder: 2,
					category: "collection",
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// GALAXY TASKS
				{
					id: nextId + 7,
					slug: "create_galaxy_1",
					title: JSON.stringify({
						en: "Galaxy Creator",
						ru: "Создатель галактик",
					}),
					description: JSON.stringify({
						en: "Create your first galaxy",
						ru: "Создайте свою первую галактику",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 1000,
					}),
					condition: JSON.stringify({
						type: "total_galaxies",
						threshold: 1,
					}),
					icon: "🌌",
					active: true,
					sortOrder: 1,
					category: "galaxy",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 8,
					slug: "upgrade_galaxy",
					title: JSON.stringify({
						en: "Galaxy Upgrader",
						ru: "Улучшатель галактик",
					}),
					description: JSON.stringify({
						en: "Upgrade any galaxy for the first time",
						ru: "Впервые улучшите любую галактику",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 500,
					}),
					condition: JSON.stringify({
						type: "first_galaxy_upgrade",
					}),
					icon: "🔧",
					active: true,
					sortOrder: 2,
					category: "galaxy",
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// UPGRADE TASKS
				{
					id: nextId + 9,
					slug: "purchase_upgrade_1",
					title: JSON.stringify({
						en: "First Upgrade",
						ru: "Первое улучшение",
					}),
					description: JSON.stringify({
						en: "Purchase your first upgrade",
						ru: "Купите свое первое улучшение",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 300,
					}),
					condition: JSON.stringify({
						type: "first_upgrade",
					}),
					icon: "⚡",
					active: true,
					sortOrder: 1,
					category: "upgrade",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 10,
					slug: "max_upgrade",
					title: JSON.stringify({
						en: "Maximizer",
						ru: "Максимизатор",
					}),
					description: JSON.stringify({
						en: "Max out any upgrade",
						ru: "Максимально улучшите любое улучшение",
					}),
					reward: JSON.stringify({
						type: "stardust",
						amount: 2000,
					}),
					condition: JSON.stringify({
						type: "max_upgrade",
					}),
					icon: "🏆",
					active: true,
					sortOrder: 2,
					category: "upgrade",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("tasktemplates", null, {});
	},
};
