"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Проверяем, есть ли уже пользователи
		const existingUsers = await queryInterface.sequelize.query(
			"SELECT id FROM users WHERE username IN (:usernames)",
			{
				replacements: { usernames: ["demo_user", "admin_user", "user2"] },
				type: Sequelize.QueryTypes.SELECT,
			}
		);

		if (existingUsers.length > 0) {
			console.log("⚠️  Пользователи уже существуют, пропускаем создание");
			return;
		}

		// Получаем следующий доступный ID
		const result = await queryInterface.sequelize.query(
			"SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM users",
			{ type: Sequelize.QueryTypes.SELECT }
		);
		const nextId = parseInt(result[0]?.next_id) || 1;

		// Demo users
		const users = [
			{
				id: nextId,
				username: "demo_user",
				referral: 0,
				role: "USER",
				blocked: false,
				tonWallet: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: nextId + 1,
				username: "admin_user",
				referral: 0,
				role: "USER",
				blocked: false,
				tonWallet: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: nextId + 2,
				username: "user2",
				referral: 0,
				role: "USER",
				blocked: false,
				tonWallet: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		await queryInterface.bulkInsert("users", users, {});

		// Получаем следующий доступный ID для userstates
		const stateResult = await queryInterface.sequelize.query(
			"SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM userstates",
			{ type: Sequelize.QueryTypes.SELECT }
		);
		const nextStateId = parseInt(stateResult[0]?.next_id) || 1;

		// Demo user states
		const userStates = [
			{
				id: nextStateId,
				userId: nextId,
				stardust: 1000,
				darkMatter: 50,
				stars: 100,
				tgStars: 0,
				tonToken: 0,
				lastLoginDate: new Date().toISOString().split("T")[0],
				currentStreak: 1,
				maxStreak: 1,
				streakUpdatedAt: new Date(),
				chaosLevel: 0.0,
				stabilityLevel: 0.0,
				entropyVelocity: 0.0,
				lastDailyBonus: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
				lockedStardust: 0,
				lockedDarkMatter: 0,
				lockedStars: 0,
				playerParameters: JSON.stringify({
					// Базовые улучшения для demo_user
					stardustProduction: 2, // Уровень 2 stardust_production
					starEfficiency: 0, // Уровень 0 star_efficiency
					cosmicHarmony: 0, // Уровень 0 cosmic_harmony
					starDiscount: 0, // Уровень 0 star_discount
					bulkCreation: 0, // Уровень 0 bulk_creation
					stellarMarket: 0, // Уровень 0 stellar_market
					darkMatterChance: 0, // Уровень 0 dark_matter_chance
					quantumInstability: 0, // Уровень 0 quantum_instability
					voidResonance: 0, // Уровень 0 void_resonance
					stardustMultiplier: 0, // Уровень 0 stardust_multiplier
					// Дополнительные параметры
					stardustRate: 1.2, // 1 + 2 * 0.1
					starCostMultiplier: 1.0,
					saleChance: 0.0,
					saleDiscount: 0.2,
					bulkDiscount: 0.0,
					darkMatterRate: 1.0,
					extraDarkMatterChance: 0.0,
					anomalyChance: 0.0,
					anomalyBonus: 2,
					synergy: 1.0,
				}),
				tutorialCompleted: false,
				lastBotNotification: JSON.stringify({
					lastBotNotificationTime: null,
					lastBotNotificationToday: {
						date: null,
						count: 0,
					},
				}),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: nextStateId + 1,
				userId: nextId + 1,
				stardust: 5000,
				darkMatter: 200,
				stars: 500,
				tgStars: 100,
				tonToken: 10,
				lastLoginDate: new Date().toISOString().split("T")[0],
				currentStreak: 3,
				maxStreak: 5,
				streakUpdatedAt: new Date(),
				chaosLevel: 0.1,
				stabilityLevel: 0.2,
				entropyVelocity: 0.05,
				lastDailyBonus: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
				lockedStardust: 100,
				lockedDarkMatter: 5,
				lockedStars: 10,
				playerParameters: JSON.stringify({
					// Продвинутые улучшения для admin_user
					stardustProduction: 5, // Уровень 5 stardust_production
					starEfficiency: 3, // Уровень 3 star_efficiency
					cosmicHarmony: 2, // Уровень 2 cosmic_harmony
					starDiscount: 4, // Уровень 4 star_discount
					bulkCreation: 2, // Уровень 2 bulk_creation
					stellarMarket: 1, // Уровень 1 stellar_market
					darkMatterChance: 2, // Уровень 2 dark_matter_chance
					quantumInstability: 1, // Уровень 1 quantum_instability
					voidResonance: 0, // Уровень 0 void_resonance
					stardustMultiplier: 1, // Уровень 1 stardust_multiplier
					// Дополнительные параметры
					stardustRate: 1.5, // 1 + 5 * 0.1
					starEfficiency: 1.24, // 1 + 3 * 0.08
					synergy: 1.3, // 1 + 2 * 0.15
					starCostMultiplier: 0.8, // 1 - 4 * 0.05
					saleChance: 0.08, // 4 * 0.02
					saleDiscount: 0.2,
					bulkDiscount: 0.06, // 2 * 0.03
					darkMatterRate: 2.0, // 1 + 2 * 0.5
					extraDarkMatterChance: 0.02, // 1 * 0.02
					anomalyChance: 0.0,
					anomalyBonus: 2,
				}),
				tutorialCompleted: false,
				lastBotNotification: JSON.stringify({
					lastBotNotificationTime: new Date().toISOString(),
					lastBotNotificationToday: {
						date: new Date().toISOString().split("T")[0],
						count: 5,
					},
				}),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: nextStateId + 2,
				userId: nextId + 2,
				stardust: 100,
				darkMatter: 5,
				stars: 10,
				tgStars: 0,
				tonToken: 0,
				lastLoginDate: new Date().toISOString().split("T")[0],
				currentStreak: 0,
				maxStreak: 0,
				streakUpdatedAt: null,
				chaosLevel: 0.0,
				stabilityLevel: 0.0,
				entropyVelocity: 0.0,
				lastDailyBonus: null,
				lockedStardust: 0,
				lockedDarkMatter: 0,
				lockedStars: 0,
				playerParameters: JSON.stringify({
					// Новый пользователь - базовые значения
					stardustProduction: 0, // Уровень 0 stardust_production
					starEfficiency: 0, // Уровень 0 star_efficiency
					cosmicHarmony: 0, // Уровень 0 cosmic_harmony
					starDiscount: 0, // Уровень 0 star_discount
					bulkCreation: 0, // Уровень 0 bulk_creation
					stellarMarket: 0, // Уровень 0 stellar_market
					darkMatterChance: 0, // Уровень 0 dark_matter_chance
					quantumInstability: 0, // Уровень 0 quantum_instability
					voidResonance: 0, // Уровень 0 void_resonance
					stardustMultiplier: 0, // Уровень 0 stardust_multiplier
					// Дополнительные параметры
					stardustRate: 1.0, // Базовое значение
					starEfficiency: 1.0,
					synergy: 1.0,
					starCostMultiplier: 1.0,
					saleChance: 0.0,
					saleDiscount: 0.2,
					bulkDiscount: 0.0,
					darkMatterRate: 1.0,
					extraDarkMatterChance: 0.0,
					anomalyChance: 0.0,
					anomalyBonus: 2,
				}),
				tutorialCompleted: false,
				lastBotNotification: JSON.stringify({
					lastBotNotificationTime: null,
					lastBotNotificationToday: {
						date: null,
						count: 0,
					},
				}),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		await queryInterface.bulkInsert("userstates", userStates, {});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("userstates", null, {});
		await queryInterface.bulkDelete("users", null, {});
	},
};
