'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			console.log(
				'Создаем отложенные внешние ключи для таблиц пакетов...'
			);

			// Создаем отложенные внешние ключи для packagestores
			await queryInterface.sequelize.query(`
				ALTER TABLE packagestores
				ADD CONSTRAINT packagestores_user_id_fk
				FOREIGN KEY ("userId") REFERENCES users(id)
				ON DELETE CASCADE ON UPDATE CASCADE
				DEFERRABLE INITIALLY DEFERRED
			`);

			await queryInterface.sequelize.query(`
				ALTER TABLE packagestores
				ADD CONSTRAINT packagestores_template_id_fk
				FOREIGN KEY ("packageTemplateId") REFERENCES packagetemplates(id)
				ON DELETE CASCADE ON UPDATE CASCADE
				DEFERRABLE INITIALLY DEFERRED
			`);

			console.log(
				'Отложенные внешние ключи для таблиц пакетов успешно созданы'
			);
		} catch (error) {
			console.error(
				'Ошибка при создании отложенных внешних ключей для таблиц пакетов:',
				error
			);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			console.log(
				'Удаляем отложенные внешние ключи для таблиц пакетов...'
			);

			// Удаляем отложенные внешние ключи
			const constraints = [
				'packagestores_user_id_fk',
				'packagestores_template_id_fk',
			];

			for (const constraint of constraints) {
				try {
					await queryInterface.removeConstraint(
						'packagestores',
						constraint
					);
					console.log(`Удален внешний ключ: ${constraint}`);
				} catch (error) {
					console.log(
						`Внешний ключ ${constraint} не найден или уже удален`
					);
				}
			}

			console.log('Создаем обычные внешние ключи для таблиц пакетов...');

			// Создаем обычные внешние ключи (без DEFERRABLE)
			await queryInterface.addConstraint('packagestores', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'packagestores_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('packagestores', {
				fields: ['packageTemplateId'],
				type: 'foreign key',
				name: 'packagestores_template_id_fk',
				references: {
					table: 'packagetemplates',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			console.log(
				'Обычные внешние ключи для таблиц пакетов успешно восстановлены'
			);
		} catch (error) {
			console.error(
				'Ошибка при восстановлении внешних ключей для таблиц пакетов:',
				error
			);
			throw error;
		}
	},
};
