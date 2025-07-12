'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Task templates based on the example
		await queryInterface.bulkInsert(
			'tasktemplates',
			[
				{
					id: 'create_stars_100',
					title: {
						en: 'First Steps',
						ru: 'Первые шаги',
					},
					description: {
						en: 'Create 100 stars in your galaxy',
						ru: 'Создайте 100 звезд в вашей галактике',
					},
					reward: 500,
					condition: {
						type: 'totalStars',
						operator: '>=',
						value: 100,
					},
					icon: '⭐',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'create_stars_1000',
					title: {
						en: 'Star Crafter',
						ru: 'Создатель звезд',
					},
					description: {
						en: 'Create 1,000 stars in your galaxy',
						ru: 'Создайте 1,000 звезд в вашей галактике',
					},
					reward: 2000,
					condition: {
						type: 'totalStars',
						operator: '>=',
						value: 1000,
					},
					icon: '⭐',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'create_stars_10000',
					title: {
						en: 'Stellar Engineer',
						ru: 'Звездный инженер',
					},
					description: {
						en: 'Create 10,000 stars in your galaxy',
						ru: 'Создайте 10,000 звезд в вашей галактике',
					},
					reward: 10000,
					condition: {
						type: 'totalStars',
						operator: '>=',
						value: 10000,
					},
					icon: '⭐',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'create_stars_50000',
					title: {
						en: 'Master of Stars',
						ru: 'Мастер звезд',
					},
					description: {
						en: 'Create 50,000 stars in your galaxy',
						ru: 'Создайте 50,000 звезд в вашей галактике',
					},
					reward: 50,
					condition: {
						type: 'totalStars',
						operator: '>=',
						value: 50000,
					},
					icon: '⭐',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'create_stars_100000',
					title: {
						en: 'Cosmic Architect',
						ru: 'Космический архитектор',
					},
					description: {
						en: 'Create 100,000 stars in your galaxy',
						ru: 'Создайте 100,000 звезд в вашей галактике',
					},
					reward: 100,
					condition: {
						type: 'totalStars',
						operator: '>=',
						value: 100000,
					},
					icon: '⭐',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'collect_stardust_5000',
					title: {
						en: 'Dust Collector',
						ru: 'Собиратель пыли',
					},
					description: {
						en: 'Collect 5,000 stardust',
						ru: 'Соберите 5,000 звездной пыли',
					},
					reward: 1000,
					condition: {
						type: 'stardustCount',
						operator: '>=',
						value: 5000,
					},
					icon: '✨',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'collect_stardust_25000',
					title: {
						en: 'Dust Magnet',
						ru: 'Магнит пыли',
					},
					description: {
						en: 'Collect 25,000 stardust',
						ru: 'Соберите 25,000 звездной пыли',
					},
					reward: 5000,
					condition: {
						type: 'stardustCount',
						operator: '>=',
						value: 25000,
					},
					icon: '✨',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'collect_stardust_100000',
					title: {
						en: 'Stardust Master',
						ru: 'Мастер звездной пыли',
					},
					description: {
						en: 'Collect 100,000 stardust',
						ru: 'Соберите 100,000 звездной пыли',
					},
					reward: 25,
					condition: {
						type: 'stardustCount',
						operator: '>=',
						value: 100000,
					},
					icon: '✨',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'collect_dark_matter_10',
					title: {
						en: 'Dark Explorer',
						ru: 'Исследователь тьмы',
					},
					description: {
						en: 'Collect 10 dark matter',
						ru: 'Соберите 10 темной материи',
					},
					reward: 5,
					condition: {
						type: 'darkMatterCount',
						operator: '>=',
						value: 10,
					},
					icon: '🌑',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'collect_dark_matter_50',
					title: {
						en: 'Void Master',
						ru: 'Мастер пустоты',
					},
					description: {
						en: 'Collect 50 dark matter',
						ru: 'Соберите 50 темной материи',
					},
					reward: 20,
					condition: {
						type: 'darkMatterCount',
						operator: '>=',
						value: 50,
					},
					icon: '🌑',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'collect_dark_matter_200',
					title: {
						en: 'Dark Matter Sage',
						ru: 'Мудрец темной материи',
					},
					description: {
						en: 'Collect 200 dark matter',
						ru: 'Соберите 200 темной материи',
					},
					reward: 50,
					condition: {
						type: 'darkMatterCount',
						operator: '>=',
						value: 200,
					},
					icon: '🌑',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'own_galaxies_3',
					title: {
						en: 'Galaxy Explorer',
						ru: 'Исследователь галактик',
					},
					description: {
						en: 'Own 3 galaxies',
						ru: 'Владейте 3 галактиками',
					},
					reward: 15,
					condition: {
						type: 'ownedGalaxiesCount',
						operator: '>=',
						value: 3,
					},
					icon: '🌌',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'own_galaxies_5',
					title: {
						en: 'Cosmic Emperor',
						ru: 'Космический император',
					},
					description: {
						en: 'Own 5 galaxies',
						ru: 'Владейте 5 галактиками',
					},
					reward: 30,
					condition: {
						type: 'ownedGalaxiesCount',
						operator: '>=',
						value: 5,
					},
					icon: '🌌',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'own_galaxies_10',
					title: {
						en: 'Universal Sovereign',
						ru: 'Вселенский суверен',
					},
					description: {
						en: 'Own 10 galaxies',
						ru: 'Владейте 10 галактиками',
					},
					reward: 100,
					condition: {
						type: 'ownedGalaxiesCount',
						operator: '>=',
						value: 10,
					},
					icon: '🌌',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'daily_login',
					title: {
						en: 'Daily Explorer',
						ru: 'Ежедневный исследователь',
					},
					description: {
						en: 'Log in daily to receive rewards',
						ru: 'Входите ежедневно для получения наград',
					},
					reward: 1000,
					condition: {
						type: 'dailyReset',
						operator: '==',
						value: true,
					},
					icon: '📆',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'weekly_login',
					title: {
						en: 'Weekly Pioneer',
						ru: 'Еженедельный пионер',
					},
					description: {
						en: 'Log in 7 days in a row',
						ru: 'Входите 7 дней подряд',
					},
					reward: 10,
					condition: {
						type: 'daysInRow',
						operator: '>=',
						value: 7,
					},
					icon: '📆',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'upgrade_galaxy',
					title: {
						en: 'Galaxy Enhancement',
						ru: 'Улучшение галактики',
					},
					description: {
						en: 'Upgrade your galaxy for the first time',
						ru: 'Улучшите вашу галактику впервые',
					},
					reward: 20,
					condition: {
						type: 'galaxyUpgraded',
						operator: '==',
						value: true,
					},
					icon: '⚙️',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'scan_galaxy_10',
					title: {
						en: 'Cosmic Researcher',
						ru: 'Космический исследователь',
					},
					description: {
						en: 'Scan your galaxy 10 times',
						ru: 'Просканируйте вашу галактику 10 раз',
					},
					reward: 2000,
					condition: {
						type: 'galaxyScans',
						operator: '>=',
						value: 10,
					},
					icon: '🔭',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'share_galaxy',
					title: {
						en: 'Stellar Ambassador',
						ru: 'Звездный посол',
					},
					description: {
						en: 'Share your galaxy with a friend',
						ru: 'Поделитесь вашей галактикой с другом',
					},
					reward: 5,
					condition: {
						type: 'galaxyShared',
						operator: '==',
						value: true,
					},
					icon: '🔗',
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('tasktemplates', null, {});
	},
};
