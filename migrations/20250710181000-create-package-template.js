'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('packagetemplates', {
			id: {
				type: Sequelize.STRING,
				primaryKey: true,
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
			currencyGame: {
				type: Sequelize.ENUM('stardust', 'darkMatter'),
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
				type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
				defaultValue: 'ACTIVE',
				allowNull: false,
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
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Создаем индексы
		await queryInterface.addIndex('packagetemplates', ['status'], {
			name: 'packagetemplate_status_idx',
		});
		await queryInterface.addIndex('packagetemplates', ['category'], {
			name: 'packagetemplate_category_idx',
		});
		await queryInterface.addIndex('packagetemplates', ['sortOrder'], {
			name: 'packagetemplate_sort_order_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('packagetemplates');
	},
};
