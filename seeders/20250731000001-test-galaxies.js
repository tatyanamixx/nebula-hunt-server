'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Test galaxies with different seeds
		await queryInterface.bulkInsert(
			'galaxies',
			[
				{
					id: 1001,
					userId: 123456789,
					starMin: 100,
					starCurrent: 150,
					price: 100,
					seed: 'test_galaxy_alpha_seed_12345',
					particleCount: 100,
					onParticleCountChange: true,
					galaxyProperties: JSON.stringify({
						name: 'Test Galaxy Alpha',
						type: 'spiral',
						color: '#4A90E2',
						size: 'medium',
						complexity: 0.7,
						description: 'A test galaxy for registration testing',
					}),
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 1002,
					userId: 555666777,
					starMin: 200,
					starCurrent: 250,
					price: 200,
					seed: 'test_galaxy_beta_seed_67890',
					particleCount: 150,
					onParticleCountChange: true,
					galaxyProperties: JSON.stringify({
						name: 'Test Galaxy Beta',
						type: 'elliptical',
						color: '#E24A90',
						size: 'large',
						complexity: 0.8,
						description: 'Another test galaxy for minimal data testing',
					}),
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 1003,
					userId: 987654321,
					starMin: 500,
					starCurrent: 600,
					price: 500,
					seed: 'test_galaxy_gamma_seed_11111',
					particleCount: 300,
					onParticleCountChange: true,
					galaxyProperties: JSON.stringify({
						name: 'Test Galaxy Gamma',
						type: 'irregular',
						color: '#90E24A',
						size: 'huge',
						complexity: 0.9,
						description: 'Test galaxy for referral testing',
					}),
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 1004,
					userId: 111222333,
					starMin: 150,
					starCurrent: 180,
					price: 150,
					seed: 'test_galaxy_delta_seed_22222',
					particleCount: 120,
					onParticleCountChange: true,
					galaxyProperties: JSON.stringify({
						name: 'Test Galaxy Delta',
						type: 'dwarf',
						color: '#E2E24A',
						size: 'small',
						complexity: 0.5,
						description: 'Test galaxy for error testing',
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
		await queryInterface.bulkDelete('galaxies', {
			id: [1001, 1002, 1003, 1004]
		}, {});
	},
}; 