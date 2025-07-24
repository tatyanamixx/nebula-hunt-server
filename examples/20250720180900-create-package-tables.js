'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create PackageTemplate table first
		await queryInterface.createTable('packagetemplates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			slug: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			amount: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			resource: {
				type: Sequelize.ENUM('stardust', 'darkMatter', 'stars'),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('tgStars', 'tonToken'),
				allowNull: false,
			},
			status: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			imageUrl: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			sortOrder: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
			},
			category: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			isPromoted: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			validUntil: {
				type: Sequelize.DATE,
				allowNull: true,
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

		// Create PackageStore table after packagetemplates
		await queryInterface.createTable('packagestores', {
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
			packageTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'packagetemplates',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			amount: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			resource: {
				type: Sequelize.ENUM('stardust', 'darkMatter', 'stars'),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('tgStars', 'tonToken'),
				allowNull: false,
			},
			status: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			isUsed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			isLocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
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

		// Add indexes
		await queryInterface.addIndex('packagetemplates', ['slug'], {
			name: 'packagetemplate_slug_idx',
		});

		await queryInterface.addIndex('packagestores', ['packageTemplateId'], {
			name: 'packagestores_package_template_id_idx',
		});
		await queryInterface.addIndex('packagestores', ['userId'], {
			name: 'packagestores_user_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable('packagestores');
		await queryInterface.dropTable('packagetemplates');
	},
};
