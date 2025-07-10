'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Добавляем поле userId, если его еще нет
		await queryInterface.addColumn('packagestores', 'userId', {
			type: Sequelize.BIGINT,
			allowNull: false,
			defaultValue: -1, // Системный пользователь по умолчанию
		});

		// Добавляем поле isUsed
		await queryInterface.addColumn('packagestores', 'isUsed', {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		});

		// Добавляем поле isLocked
		await queryInterface.addColumn('packagestores', 'isLocked', {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		});

		// Создаем индекс по userId для быстрого поиска
		await queryInterface.addIndex('packagestores', ['userId'], {
			name: 'packagestores_user_id_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Удаляем индекс
		await queryInterface.removeIndex(
			'packagestores',
			'packagestores_user_id_idx'
		);

		// Удаляем поля
		await queryInterface.removeColumn('packagestores', 'isLocked');
		await queryInterface.removeColumn('packagestores', 'isUsed');
		await queryInterface.removeColumn('packagestores', 'userId');
	},
};
