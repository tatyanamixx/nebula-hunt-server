'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Demo artifacts
		await queryInterface.bulkInsert(
			'artifacts',
			[
				{
					id: 1,
					userId: 123456789,
					seed: 'artifact_common_stardust_boost_001',
					name: 'Stardust Amplifier',
					description:
						'A common artifact that slightly increases stardust production',
					rarity: 'COMMON',
					image: 'stardust_amplifier.png',
					effects: {
						stardust: 0.1,
						stability: 0.05,
					},
					tradable: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: 123456789,
					seed: 'artifact_uncommon_chaos_crystal_002',
					name: 'Chaos Crystal',
					description:
						'An uncommon crystal that increases chaos generation',
					rarity: 'UNCOMMON',
					image: 'chaos_crystal.png',
					effects: {
						chaos: 0.2,
						stability: -0.1,
					},
					tradable: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					userId: 987654321,
					seed: 'artifact_rare_dark_matter_orb_003',
					name: 'Dark Matter Orb',
					description:
						'A rare orb that significantly boosts dark matter production',
					rarity: 'RARE',
					image: 'dark_matter_orb.png',
					effects: {
						darkMatter: 0.5,
						stability: 0.2,
					},
					tradable: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					userId: null, // Available for purchase
					seed: 'artifact_epic_stellar_engine_004',
					name: 'Stellar Engine',
					description:
						'An epic engine that multiplies all resource production',
					rarity: 'EPIC',
					image: 'stellar_engine.png',
					effects: {
						production: 2.0,
						stability: 0.3,
						chaos: 0.1,
					},
					tradable: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 5,
					userId: null, // Available for purchase
					seed: 'artifact_legendary_cosmic_heart_005',
					name: 'Cosmic Heart',
					description:
						'A legendary artifact that grants immense power',
					rarity: 'LEGENDARY',
					image: 'cosmic_heart.png',
					effects: {
						production: 5.0,
						stability: 1.0,
						chaos: 0.5,
						darkMatter: 2.0,
					},
					tradable: false, // Legendary artifacts are not tradable
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('artifacts', null, {});
	},
};
