'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create PackageStore table
		await queryInterface.createTable('packagestores', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
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
				type: Sequelize.ENUM(
					'tgStars',
					'tonToken',
					'stars',
					'stardust',
					'darkMatter'
				),
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
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Indexes for packagestores
		await queryInterface.addIndex('packagestores', ['userId'], {
			name: 'packagestore_user_id_idx',
		});
		await queryInterface.addIndex('packagestores', ['packageTemplateId'], {
			name: 'packagestore_package_template_id_idx',
		});
		await queryInterface.addIndex('packagestores', ['status'], {
			name: 'packagestore_status_idx',
		});
		await queryInterface.addIndex('packagestores', ['isUsed'], {
			name: 'packagestore_is_used_idx',
		});
		await queryInterface.addIndex('packagestores', ['isLocked'], {
			name: 'packagestore_is_locked_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop PackageStore table
		await queryInterface.dropTable('packagestores');
	},
}; 