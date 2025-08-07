"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Получаем следующий доступный ID
		const result = await queryInterface.sequelize.query(
			"SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM upgradenodetemplates",
			{ type: Sequelize.QueryTypes.SELECT }
		);
		const nextId = parseInt(result[0]?.next_id) || 1;

		// Upgrade nodes based on the real game data
		await queryInterface.bulkInsert(
			"upgradenodetemplates",
			[
				// PRODUCTION UPGRADES (Stardust)
				{
					id: nextId,
					slug: "stardust_production",
					name: "Stardust Collector",
					description: JSON.stringify({
						en: "Increases stardust production rate",
						ru: "Увеличивает скорость производства звездной пыли",
					}),
					maxLevel: 20,
					basePrice: 1000,
					effectPerLevel: 0.1,
					priceMultiplier: 1.5,
					currency: "stardust",
					category: "production",
					icon: "⚡",
					stability: 0.0,
					instability: 0.0,
					modifiers: JSON.stringify({
						stardustRate: 1.0,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredLevel: 1,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 1,
					slug: "star_efficiency",
					name: "Star Efficiency",
					description: JSON.stringify({
						en: "Stars generate more stardust based on their luminosity",
						ru: "Звезды генерируют больше звездной пыли на основе их светимости",
					}),
					maxLevel: 15,
					basePrice: 2000,
					effectPerLevel: 0.08,
					priceMultiplier: 1.6,
					currency: "stardust",
					category: "production",
					icon: "🔆",
					stability: 0.0,
					instability: 0.0,
					modifiers: JSON.stringify({
						starEfficiency: 1.0,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredNodes: ["stardust_production"],
						requiredLevel: 2,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 2,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 2,
					slug: "cosmic_harmony",
					name: "Cosmic Harmony",
					description: JSON.stringify({
						en: "Stars work in harmony, boosting overall production",
						ru: "Звезды работают в гармонии, повышая общее производство",
					}),
					maxLevel: 10,
					basePrice: 7500,
					effectPerLevel: 0.15,
					priceMultiplier: 1.7,
					currency: "stardust",
					category: "production",
					icon: "☯️",
					stability: 0.1,
					instability: 0.0,
					modifiers: JSON.stringify({
						synergy: 1.0,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredNodes: ["stardust_production"],
						requiredLevel: 3,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// ECONOMY UPGRADES (Stardust)
				{
					id: nextId + 3,
					slug: "star_discount",
					name: "Star Discount",
					description: JSON.stringify({
						en: "Reduces the cost of creating stars",
						ru: "Снижает стоимость создания звезд",
					}),
					maxLevel: 10,
					basePrice: 2500,
					effectPerLevel: 0.05,
					priceMultiplier: 1.7,
					currency: "stardust",
					category: "economy",
					icon: "💰",
					stability: 0.0,
					instability: 0.0,
					modifiers: JSON.stringify({
						starCostMultiplier: 1.0,
						saleChance: 0.0,
						saleDiscount: 0.2,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredLevel: 2,
					}),
					children: Sequelize.literal(
						"ARRAY['bulk_creation', 'stellar_market']::VARCHAR[]"
					),
					weight: 2,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 4,
					slug: "bulk_creation",
					name: "Bulk Creation",
					description: JSON.stringify({
						en: "Creating multiple stars at once gives a discount",
						ru: "Создание нескольких звезд одновременно дает скидку",
					}),
					maxLevel: 10,
					basePrice: 5000,
					effectPerLevel: 0.03,
					priceMultiplier: 1.65,
					currency: "stardust",
					category: "economy",
					icon: "📊",
					stability: 0.0,
					instability: 0.0,
					modifiers: JSON.stringify({
						bulkDiscount: 0.0,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredNodes: ["star_discount"],
						requiredLevel: 3,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 5,
					slug: "stellar_market",
					name: "Stellar Market",
					description: JSON.stringify({
						en: "Occasional sales on star creation costs",
						ru: "Периодические распродажи на стоимость создания звезд",
					}),
					maxLevel: 5,
					basePrice: 10000,
					effectPerLevel: 0.1,
					priceMultiplier: 2.0,
					currency: "stardust",
					category: "economy",
					icon: "🏪",
					stability: 0.0,
					instability: 0.0,
					modifiers: JSON.stringify({
						saleChance: 0.0,
						saleDiscount: 0.2,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredNodes: ["star_discount"],
						requiredLevel: 4,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// CHANCE UPGRADES (Dark Matter)
				{
					id: nextId + 6,
					slug: "dark_matter_chance",
					name: "Dark Matter Extractor",
					description: JSON.stringify({
						en: "Improve dark matter extraction rate",
						ru: "Улучшить скорость извлечения темной материи",
					}),
					maxLevel: 5,
					basePrice: 5,
					effectPerLevel: 0.5,
					priceMultiplier: 1.8,
					currency: "darkmatter",
					category: "chance",
					icon: "🌑",
					stability: 0.0,
					instability: 0.1,
					modifiers: JSON.stringify({
						darkMatterRate: 1.0,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredLevel: 5,
					}),
					children: Sequelize.literal(
						"ARRAY['quantum_instability', 'void_resonance']::VARCHAR[]"
					),
					weight: 2,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 7,
					slug: "quantum_instability",
					name: "Quantum Instability",
					description: JSON.stringify({
						en: "Introduces quantum fluctuations that can yield dark matter",
						ru: "Вводит квантовые флуктуации, которые могут дать темную материю",
					}),
					maxLevel: 8,
					basePrice: 40,
					effectPerLevel: 0.02,
					priceMultiplier: 1.6,
					currency: "darkmatter",
					category: "chance",
					icon: "⚛️",
					stability: -0.1,
					instability: 0.2,
					modifiers: JSON.stringify({
						extraDarkMatterChance: 0.0,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredNodes: ["dark_matter_chance"],
						requiredLevel: 6,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: nextId + 8,
					slug: "void_resonance",
					name: "Void Resonance",
					description: JSON.stringify({
						en: "Occasional bursts of dark matter from cosmic anomalies",
						ru: "Периодические всплески темной материи из космических аномалий",
					}),
					maxLevel: 5,
					basePrice: 60,
					effectPerLevel: 0.05,
					priceMultiplier: 1.8,
					currency: "darkmatter",
					category: "chance",
					icon: "🌀",
					stability: 0.0,
					instability: 0.15,
					modifiers: JSON.stringify({
						anomalyChance: 0.0,
						anomalyBonus: 2,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredNodes: ["dark_matter_chance"],
						requiredLevel: 7,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// MULTIPLIER UPGRADES (Dark Matter)
				{
					id: nextId + 9,
					slug: "stardust_multiplier",
					name: "Quantum Accelerator",
					description: JSON.stringify({
						en: "Multiplier for all stardust gains",
						ru: "Множитель для всех приростов звездной пыли",
					}),
					maxLevel: 10,
					basePrice: 50,
					effectPerLevel: 0.2,
					priceMultiplier: 1.8,
					currency: "darkmatter",
					category: "multiplier",
					icon: "✨",
					stability: 0.0,
					instability: 0.0,
					modifiers: JSON.stringify({
						stardustMultiplier: 1.0,
					}),
					active: true,
					conditions: JSON.stringify({
						requiredLevel: 8,
					}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 4,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("upgradenodetemplates", null, {});
	},
};
