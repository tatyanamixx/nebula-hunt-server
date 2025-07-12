'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Event templates based on the example
		await queryInterface.bulkInsert(
			'eventtemplates',
			[
				{
					id: 'supernova_bonus',
					name: 'Supernova Bonus',
					description: {
						en: 'A massive energy burst doubles your production!',
						ru: 'Вспышка сверхновой удваивает производство!',
					},
					type: 'ONE_TIME',
					triggerConfig: {
						at: '2025-07-01T12:00:00Z',
					},
					effect: {
						multipliers: {
							cps: 2.0,
						},
						duration: 600,
					},
					frequency: {},
					conditions: {
						minLevel: 10,
					},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'chaos_spike',
					name: 'Chaos Spike',
					description: {
						en: 'Triggered when chaos level exceeds threshold.',
						ru: 'Срабатывает при достижении высокого уровня хаоса.',
					},
					type: 'CONDITIONAL',
					triggerConfig: {
						condition: {
							chaosLevel: {
								$gt: 70,
							},
						},
					},
					effect: {
						multipliers: {
							entropy: 1.5,
						},
						duration: 300,
					},
					frequency: {},
					conditions: {},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'daily_reward',
					name: 'Daily Reward',
					description: {
						en: 'Daily check-in bonus!',
						ru: 'Ежедневная награда за вход!',
					},
					type: 'PERIODIC',
					triggerConfig: {
						interval: '24h',
					},
					effect: {
						reward: {
							stardust: 50,
						},
					},
					frequency: {
						maxPerDay: 1,
					},
					conditions: {},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'solar_flare',
					name: 'Solar Flare',
					description: {
						en: 'A solar flare temporarily boosts resource production.',
						ru: 'Вспышка на Солнце временно увеличивает производство.',
					},
					type: 'RANDOM',
					triggerConfig: {
						chancePerMinute: 0.05,
					},
					effect: {
						multipliers: {
							cps: 1.25,
						},
						duration: 180,
					},
					frequency: {
						maxPerHour: 2,
					},
					conditions: {},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'blackhole_followup',
					name: 'Black Hole Awakens',
					description: {
						en: 'This event triggers after the black hole introduction.',
						ru: 'Событие активируется после вступления в черную дыру.',
					},
					type: 'CHAINED',
					triggerConfig: {
						after: 'blackhole_intro',
					},
					effect: {
						multipliers: {
							chaos: 2.0,
						},
						duration: 1200,
					},
					frequency: {},
					conditions: {},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'galaxy_storm',
					name: 'Galaxy Storm',
					description: {
						en: 'A cosmic storm increases resource generation temporarily.',
						ru: 'Космическая буря временно увеличивает генерацию ресурсов.',
					},
					type: 'RANDOM',
					triggerConfig: {
						chancePerMinute: 0.02,
					},
					effect: {
						multipliers: {
							stardust: 1.5,
							darkMatter: 1.3,
						},
						duration: 900,
					},
					frequency: {
						maxPerDay: 3,
					},
					conditions: {
						minGalaxies: 2,
					},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'cosmic_harvest',
					name: 'Cosmic Harvest',
					description: {
						en: 'Harvest bonus resources from your galaxies.',
						ru: 'Соберите бонусные ресурсы из ваших галактик.',
					},
					type: 'PERIODIC',
					triggerConfig: {
						interval: '12h',
					},
					effect: {
						reward: {
							stardust: 100,
							darkMatter: 5,
						},
					},
					frequency: {
						maxPerDay: 2,
					},
					conditions: {
						minLevel: 5,
					},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'stellar_convergence',
					name: 'Stellar Convergence',
					description: {
						en: 'Stars align for maximum efficiency.',
						ru: 'Звезды выстраиваются для максимальной эффективности.',
					},
					type: 'CONDITIONAL',
					triggerConfig: {
						condition: {
							totalStars: {
								$gte: 10000,
							},
							stability: {
								$gte: 0.8,
							},
						},
					},
					effect: {
						multipliers: {
							production: 3.0,
							stability: 0.5,
						},
						duration: 600,
					},
					frequency: {
						maxPerDay: 1,
					},
					conditions: {
						minStars: 10000,
						minStability: 0.8,
					},
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('eventtemplates', null, {});
	},
};
