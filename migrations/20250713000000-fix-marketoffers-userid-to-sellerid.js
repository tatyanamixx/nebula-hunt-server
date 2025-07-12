'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Удалить userId, если есть
		const table = await queryInterface.describeTable('marketoffers');
		if (table.userId) {
			await queryInterface.removeColumn('marketoffers', 'userId');
		}
		// Добавить sellerId, если нет
		if (!table.sellerId) {
			await queryInterface.addColumn('marketoffers', 'sellerId', {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			});
			// Индекс для sellerId
			await queryInterface.addIndex('marketoffers', ['sellerId'], {
				name: 'marketoffers_seller_id_idx',
			});
		}
	},

	async down(queryInterface, Sequelize) {
		// Откат: добавить userId, если нужно, и удалить sellerId
		const table = await queryInterface.describeTable('marketoffers');
		if (table.sellerId) {
			await queryInterface.removeColumn('marketoffers', 'sellerId');
		}
		if (!table.userId) {
			await queryInterface.addColumn('marketoffers', 'userId', {
				type: Sequelize.BIGINT,
				allowNull: true,
			});
		}
	},
};
