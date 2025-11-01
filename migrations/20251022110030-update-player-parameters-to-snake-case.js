"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Обновляем все существующие записи, конвертируя camelCase в snake_case
		await queryInterface.sequelize.query(`
			UPDATE userstates
			SET "playerParameters" = jsonb_build_object(
				'stardust_production', COALESCE(("playerParameters"->>'stardustProduction')::int, ("playerParameters"->>'stardust_production')::int, 0),
				'star_efficiency', COALESCE(("playerParameters"->>'star_efficiency')::int, 0),
				'cosmic_harmony', COALESCE(("playerParameters"->>'cosmicHarmony')::int, ("playerParameters"->>'cosmic_harmony')::int, 0),
				'star_discount', COALESCE(("playerParameters"->>'starDiscount')::int, ("playerParameters"->>'star_discount')::int, 0),
				'bulk_creation', COALESCE(("playerParameters"->>'bulkCreation')::int, ("playerParameters"->>'bulk_creation')::int, 0),
				'stellar_market', COALESCE(("playerParameters"->>'stellarMarket')::int, ("playerParameters"->>'stellar_market')::int, 0),
				'dark_matter_chance', COALESCE(("playerParameters"->>'darkMatterChance')::int, ("playerParameters"->>'dark_matter_chance')::int, 0),
				'quantum_instability', COALESCE(("playerParameters"->>'quantumInstability')::int, ("playerParameters"->>'quantum_instability')::int, 0),
				'void_resonance', COALESCE(("playerParameters"->>'voidResonance')::int, ("playerParameters"->>'void_resonance')::int, 0),
				'stardust_multiplier', COALESCE(("playerParameters"->>'stardustMultiplier')::int, ("playerParameters"->>'stardust_multiplier')::int, 0),
				'dark_energy_infusion', COALESCE(("playerParameters"->>'dark_energy_infusion')::int, 0),
				'cosmic_acceleration', COALESCE(("playerParameters"->>'cosmic_acceleration')::int, 0),
				'galaxy_explorer', COALESCE(("playerParameters"->>'galaxyExplorer')::int, ("playerParameters"->>'galaxy_explorer')::int, 0),
				'stellar_forge', COALESCE(("playerParameters"->>'stellarForge')::int, ("playerParameters"->>'stellar_forge')::int, 0),
				'dark_matter_synthesis', COALESCE(("playerParameters"->>'darkMatterSynthesis')::int, ("playerParameters"->>'dark_matter_synthesis')::int, 0)
			)
			WHERE "playerParameters" IS NOT NULL;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Обратная миграция - конвертируем snake_case обратно в camelCase
		await queryInterface.sequelize.query(`
			UPDATE userstates
			SET "playerParameters" = jsonb_build_object(
				'stardustProduction', COALESCE(("playerParameters"->>'stardust_production')::int, 0),
				'starDiscount', COALESCE(("playerParameters"->>'star_discount')::int, 0),
				'darkMatterChance', COALESCE(("playerParameters"->>'dark_matter_chance')::int, 0),
				'stardustMultiplier', COALESCE(("playerParameters"->>'stardust_multiplier')::int, 0),
				'galaxyExplorer', COALESCE(("playerParameters"->>'galaxy_explorer')::int, 0),
				'darkMatterSynthesis', COALESCE(("playerParameters"->>'dark_matter_synthesis')::int, 0),
				'bulkCreation', COALESCE(("playerParameters"->>'bulk_creation')::int, 0),
				'stellarMarket', COALESCE(("playerParameters"->>'stellar_market')::int, 0),
				'cosmicHarmony', COALESCE(("playerParameters"->>'cosmic_harmony')::int, 0),
				'overflowProtection', 0,
				'quantumInstability', COALESCE(("playerParameters"->>'quantum_instability')::int, 0),
				'voidResonance', COALESCE(("playerParameters"->>'void_resonance')::int, 0),
				'stellarForge', COALESCE(("playerParameters"->>'stellar_forge')::int, 0)
			)
			WHERE "playerParameters" IS NOT NULL;
		`);
	},
};
