"use strict";

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			"upgradenodetemplates",
			[
				// ============= STARDUST UPGRADES =============
				// PRODUCTION UPGRADES
				{
					slug: "stardust_production",
					name: '{"en": "Stardust Collector", "ru": "Сборщик звездной пыли"}',
					description:
						'{"en": "Increases stardust production rate", "ru": "Увеличивает скорость производства звездной пыли"}',
					maxLevel: 20,
					basePrice: 1000,
					priceMultiplier: 1.5,
					effectPerLevel: 0.1,
					icon: "⚡",
					currency: "stardust",
					category: "production",
					active: true,
					modifiers: JSON.stringify({
						stardustRate: 0.1, // +10% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "star_efficiency",
					name: '{"en": "Star Efficiency", "ru": "Эффективность звезд"}',
					description:
						'{"en": "Stars generate more stardust based on their luminosity", "ru": "Звезды генерируют больше звездной пыли на основе их яркости"}',
					maxLevel: 15,
					basePrice: 2000,
					priceMultiplier: 1.6,
					effectPerLevel: 0.08,
					icon: "🔆",
					currency: "stardust",
					category: "production",
					active: true,
					modifiers: JSON.stringify({
						starEfficiency: 0.08, // +8% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "cosmic_harmony",
					name: '{"en": "Cosmic Harmony", "ru": "Космическая гармония"}',
					description:
						'{"en": "Stars work in harmony, boosting overall production", "ru": "Звезды работают в гармонии, увеличивая общее производство"}',
					maxLevel: 10,
					basePrice: 7500,
					priceMultiplier: 1.7,
					effectPerLevel: 0.15,
					icon: "☯️",
					currency: "stardust",
					category: "production",
					active: true,
					modifiers: JSON.stringify({
						synergy: 0.15, // +15% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// ECONOMY UPGRADES
				{
					slug: "star_discount",
					name: '{"en": "Star Discount", "ru": "Скидка на звезды"}',
					description:
						'{"en": "Reduces the cost of creating stars", "ru": "Снижает стоимость создания звезд"}',
					maxLevel: 10,
					basePrice: 2500,
					priceMultiplier: 1.7,
					effectPerLevel: 0.05,
					icon: "💰",
					currency: "stardust",
					category: "economy",
					active: true,
					modifiers: JSON.stringify({
						starCostMultiplier: -0.05, // -5% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "bulk_creation",
					name: '{"en": "Bulk Creation", "ru": "Массовое создание"}',
					description:
						'{"en": "Creating multiple stars at once gives a discount", "ru": "Создание нескольких звезд одновременно дает скидку"}',
					maxLevel: 10,
					basePrice: 5000,
					priceMultiplier: 1.65,
					effectPerLevel: 0.03,
					icon: "📊",
					currency: "stardust",
					category: "economy",
					active: true,
					modifiers: JSON.stringify({
						bulkDiscount: 0.03, // +3% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "stellar_market",
					name: '{"en": "Stellar Market", "ru": "Звездный рынок"}',
					description:
						'{"en": "Occasional sales on star creation costs", "ru": "Периодические скидки на создание звезд"}',
					maxLevel: 5,
					basePrice: 10000,
					priceMultiplier: 2.0,
					effectPerLevel: 0.1,
					icon: "🏪",
					currency: "stardust",
					category: "economy",
					active: true,
					modifiers: JSON.stringify({
						saleChance: 0.1, // +10% per level
						saleDiscount: 0.2,
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// ============= DARK MATTER UPGRADES =============
				// CHANCE UPGRADES
				{
					slug: "dark_matter_chance",
					name: '{"en": "Dark Matter Extractor", "ru": "Экстрактор темной материи"}',
					description:
						'{"en": "Improve dark matter extraction rate", "ru": "Улучшает скорость добычи темной материи"}',
					maxLevel: 5,
					basePrice: 5,
					priceMultiplier: 1.8,
					effectPerLevel: 0.5,
					icon: "🌑",
					currency: "darkmatter",
					category: "chance",
					active: true,
					modifiers: JSON.stringify({
						darkMatterRate: 0.5, // +50% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "quantum_instability",
					name: '{"en": "Quantum Instability", "ru": "Квантовая нестабильность"}',
					description:
						'{"en": "Introduces quantum fluctuations that can yield dark matter", "ru": "Вводит квантовые флуктуации, которые могут давать темную материю"}',
					maxLevel: 8,
					basePrice: 40,
					priceMultiplier: 1.6,
					effectPerLevel: 0.02,
					icon: "⚛️",
					currency: "darkmatter",
					category: "chance",
					active: true,
					modifiers: JSON.stringify({
						extraDarkMatterChance: 0.02, // +2% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "void_resonance",
					name: '{"en": "Void Resonance", "ru": "Резонанс пустоты"}',
					description:
						'{"en": "Occasional bursts of dark matter from cosmic anomalies", "ru": "Периодические всплески темной материи от космических аномалий"}',
					maxLevel: 5,
					basePrice: 60,
					priceMultiplier: 1.8,
					effectPerLevel: 0.05,
					icon: "🌀",
					currency: "darkmatter",
					category: "chance",
					active: true,
					modifiers: JSON.stringify({
						anomalyChance: 0.05, // +5% per level
						anomalyBonus: 2,
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// MULTIPLIER UPGRADES
				{
					slug: "stardust_multiplier",
					name: '{"en": "Quantum Accelerator", "ru": "Квантовый ускоритель"}',
					description:
						'{"en": "Multiplier for all stardust gains", "ru": "Множитель для всего получения звездной пыли"}',
					maxLevel: 10,
					basePrice: 50,
					priceMultiplier: 1.8,
					effectPerLevel: 0.2,
					icon: "✨",
					currency: "darkmatter",
					category: "multiplier",
					active: true,
					modifiers: JSON.stringify({
						stardustMultiplier: 0.2, // +20% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "dark_energy_infusion",
					name: '{"en": "Dark Energy Infusion", "ru": "Наполнение темной энергией"}',
					description:
						'{"en": "Infuse stars with dark energy to boost their output", "ru": "Наполняет звезды темной энергией для увеличения их производства"}',
					maxLevel: 8,
					basePrice: 75,
					priceMultiplier: 1.7,
					effectPerLevel: 0.15,
					icon: "💫",
					currency: "darkmatter",
					category: "multiplier",
					active: true,
					modifiers: JSON.stringify({
						darkEnergyBoost: 0.15, // +15% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "cosmic_acceleration",
					name: '{"en": "Cosmic Acceleration", "ru": "Космическое ускорение"}',
					description:
						'{"en": "Time flows faster in your galaxy, speeding up all production", "ru": "Время течет быстрее в вашей галактике, ускоряя все производство"}',
					maxLevel: 5,
					basePrice: 150,
					priceMultiplier: 1.9,
					effectPerLevel: 0.1,
					icon: "⏩",
					currency: "darkmatter",
					category: "multiplier",
					active: true,
					modifiers: JSON.stringify({
						productionSpeed: 0.1, // +10% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},

				// SPECIAL UPGRADES
				{
					slug: "galaxy_explorer",
					name: '{"en": "Galaxy Explorer", "ru": "Исследователь галактик"}',
					description:
						'{"en": "Chance to get special events when exploring galaxies", "ru": "Шанс получить особые события при исследовании галактик"}',
					maxLevel: 5,
					basePrice: 100,
					priceMultiplier: 1.8,
					effectPerLevel: 1,
					icon: "🔭",
					currency: "darkmatter",
					category: "special",
					active: true,
					modifiers: JSON.stringify({
						specialEvents: 1, // +1 per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					slug: "dark_matter_synthesis",
					name: '{"en": "Dark Matter Synthesis", "ru": "Синтез темной материи"}',
					description:
						'{"en": "Chance to create dark matter when creating stars", "ru": "Шанс создать темную материю при создании звезд"}',
					maxLevel: 5,
					basePrice: 250,
					priceMultiplier: 2.2,
					effectPerLevel: 0.02,
					icon: "🧪",
					currency: "darkmatter",
					category: "special",
					active: true,
					modifiers: JSON.stringify({
						starDarkMatterChance: 0.02, // +2% per level
					}),
					conditions: JSON.stringify({}),
					children: Sequelize.literal("ARRAY[]::VARCHAR[]"),
					weight: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем все шаблоны улучшений
		await queryInterface.bulkDelete(
			"upgradenodetemplates",
			{
				slug: {
					[Sequelize.Op.in]: [
						"stardust_production",
						"star_efficiency",
						"cosmic_harmony",
						"star_discount",
						"bulk_creation",
						"stellar_market",
						"dark_matter_chance",
						"quantum_instability",
						"void_resonance",
						"stardust_multiplier",
						"dark_energy_infusion",
						"cosmic_acceleration",
						"galaxy_explorer",
						"stellar_forge",
						"dark_matter_synthesis",
					],
				},
			},
			{}
		);
	},
};
