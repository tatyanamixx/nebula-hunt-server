'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Demo galaxies
		await queryInterface.bulkInsert(
			'galaxies',
			[
				{
					id: 1,
					userId: 123456789,
					starMin: 100,
					starCurrent: 150,
					price: 100,
					seed: 'demo_galaxy_1_seed_12345',
					particleCount: 100,
					onParticleCountChange: true,
					galaxyProperties: JSON.stringify({
						name: 'Demo Galaxy Alpha',
						type: 'spiral',
						color: '#4A90E2',
						size: 'medium',
						complexity: 0.7,
					}),
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					userId: 123456789,
					starMin: 200,
					starCurrent: 250,
					price: 200,
					seed: 'demo_galaxy_2_seed_67890',
					particleCount: 150,
					onParticleCountChange: true,
					galaxyProperties: JSON.stringify({
						name: 'Demo Galaxy Beta',
						type: 'elliptical',
						color: '#E24A90',
						size: 'large',
						complexity: 0.8,
					}),
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					userId: 987654321,
					starMin: 500,
					starCurrent: 600,
					price: 500,
					seed: 'admin_galaxy_seed_11111',
					particleCount: 300,
					onParticleCountChange: true,
					galaxyProperties: JSON.stringify({
						name: 'Admin Galaxy Prime',
						type: 'irregular',
						color: '#90E24A',
						size: 'huge',
						complexity: 0.9,
					}),
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('galaxies', null, {});
	},
};
