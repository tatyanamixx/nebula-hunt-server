'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create Galaxy table
		await queryInterface.createTable('galaxies', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			starMin: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			starCurrent: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			price: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
			},
			particleCount: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
			},
			onParticleCountChange: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			galaxyProperties: {
				type: Sequelize.JSONB,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create Artifact table
		await queryInterface.createTable('artifacts', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: true,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'SET NULL',
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
			},
			rarity: {
				type: Sequelize.ENUM(
					'COMMON',
					'UNCOMMON',
					'RARE',
					'EPIC',
					'LEGENDARY'
				),
				defaultValue: 'COMMON',
			},
			image: {
				type: Sequelize.STRING,
			},
			effects: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Например: { chaos: 0.1, stability: -0.2 }',
			},
			tradable: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create UpgradeNode table
		await queryInterface.createTable('upgradenodes', {
			id: {
				type: Sequelize.STRING(50),
				primaryKey: true,
				unique: true,
			},
			name: {
				type: Sequelize.STRING,
			},
			description: {
				type: Sequelize.JSONB,
				defaultValue: {
					en: '',
					ru: '',
				},
				comment: 'Localized upgrade node descriptions',
			},
			maxLevel: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			basePrice: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			effectPerLevel: {
				type: Sequelize.FLOAT,
				defaultValue: 0,
			},
			priceMultiplier: {
				type: Sequelize.FLOAT,
				defaultValue: 1.0,
			},
			resource: {
				type: Sequelize.ENUM('stardust', 'darkmetter', 'stars'),
				defaultValue: 'stardust',
			},
			category: {
				type: Sequelize.ENUM(
					'production',
					'economy',
					'special',
					'chance',
					'storage',
					'multiplier'
				),
				defaultValue: 'production',
			},
			icon: {
				type: Sequelize.STRING(3),
				defaultValue: '',
			},
			stability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			instability: {
				type: Sequelize.FLOAT,
				defaultValue: 0.0,
			},
			modifiers: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment: 'Additional modifiers and effects of the upgrade',
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			conditions: {
				type: Sequelize.JSONB,
				defaultValue: {},
				comment:
					'Conditions required to unlock or purchase the upgrade',
			},
			delayedUntil: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: 'Timestamp until which the upgrade is delayed',
			},
			children: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: [],
				comment:
					'Array of node names that are unlocked by this upgrade',
			},
			weight: {
				type: Sequelize.INTEGER,
				defaultValue: 1,
				comment: 'Weight/difficulty of the upgrade node',
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create indexes
		await queryInterface.addIndex('galaxies', ['seed'], {
			name: 'galaxy_seed_idx',
		});
		await queryInterface.addIndex('galaxies', ['userId'], {
			name: 'galaxy_user_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable('upgradenodes');
		await queryInterface.dropTable('artifacts');
		await queryInterface.dropTable('galaxies');
	},
};
