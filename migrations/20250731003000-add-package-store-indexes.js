'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		console.log(
			'Добавление индексов для таблицы packagestores (включая индексы для отложенных событий)...'
		);

		// Проверяем существующие индексы
		const existingIndexes = await queryInterface.sequelize.query(
			`
			SELECT indexname 
			FROM pg_indexes 
			WHERE tablename = 'packagestores';
		`,
			{ type: queryInterface.sequelize.QueryTypes.SELECT }
		);

		const existingIndexNames = existingIndexes.map((idx) => idx.indexname);

		// Определяем индексы, которые нужно создать
		const indexesToCreate = [
			// Основные индексы для быстрого поиска
			{
				name: 'packagestore_user_id_idx',
				columns: ['userId'],
				description: 'Индекс для быстрого поиска по userId',
			},
			{
				name: 'packagestore_package_template_id_idx',
				columns: ['packageTemplateId'],
				description: 'Индекс для быстрого поиска по packageTemplateId',
			},
			{
				name: 'packagestore_user_package_idx',
				columns: ['userId', 'packageTemplateId'],
				description:
					'Составной индекс для уникальных комбинаций userId + packageTemplateId',
			},

			// Индексы для отложенных событий и проверок статуса
			{
				name: 'packagestore_status_used_locked_idx',
				columns: ['status', 'isUsed', 'isLocked'],
				description:
					'Составной индекс для фильтрации по статусу, использованию и блокировке (отложенные события)',
			},
			{
				name: 'packagestore_available_packages_idx',
				columns: ['status', 'isUsed', 'isLocked', 'userId'],
				description:
					'Индекс для поиска доступных пакетов пользователя (status=true, isUsed=false, isLocked=false)',
			},
			{
				name: 'packagestore_pending_events_idx',
				columns: ['isLocked', 'status', 'createdAt'],
				description:
					'Индекс для поиска отложенных событий (isLocked=true, status=true) с сортировкой по времени',
			},

			// Индексы для временных проверок
			{
				name: 'packagestore_created_at_idx',
				columns: ['createdAt'],
				description:
					'Индекс для сортировки по дате создания (отложенные события)',
			},
			{
				name: 'packagestore_updated_at_idx',
				columns: ['updatedAt'],
				description:
					'Индекс для отслеживания изменений (отложенные события)',
			},
			{
				name: 'packagestore_time_based_idx',
				columns: ['createdAt', 'status', 'isLocked'],
				description:
					'Составной индекс для временных проверок отложенных событий',
			},

			// Индексы для фильтрации по ресурсам и валютам
			{
				name: 'packagestore_resource_idx',
				columns: ['resource'],
				description: 'Индекс для фильтрации по типу ресурса',
			},
			{
				name: 'packagestore_currency_idx',
				columns: ['currency'],
				description: 'Индекс для фильтрации по валюте',
			},
			{
				name: 'packagestore_resource_currency_idx',
				columns: ['resource', 'currency'],
				description:
					'Составной индекс для фильтрации по ресурсу и валюте',
			},

			// Специальные индексы для отложенных проверок
			{
				name: 'packagestore_deferred_check_idx',
				columns: [
					'isLocked',
					'status',
					'isUsed',
					'userId',
					'createdAt',
				],
				description:
					'Оптимизированный индекс для проверки отложенных событий',
			},
			{
				name: 'packagestore_batch_processing_idx',
				columns: ['status', 'isLocked', 'createdAt', 'id'],
				description: 'Индекс для пакетной обработки отложенных событий',
			},
		];

		// Создаем только те индексы, которых еще нет
		for (const index of indexesToCreate) {
			if (!existingIndexNames.includes(index.name)) {
				try {
					await queryInterface.addIndex(
						'packagestores',
						index.columns,
						{
							name: index.name,
							comment: index.description,
						}
					);
					console.log(
						`✓ Создан индекс: ${index.name} (${index.columns.join(
							', '
						)})`
					);
				} catch (error) {
					console.error(
						`✗ Ошибка создания индекса ${index.name}:`,
						error.message
					);
				}
			} else {
				console.log(
					`- Индекс ${index.name} уже существует, пропускаем`
				);
			}
		}

		// Проверяем финальное состояние индексов
		const finalIndexes = await queryInterface.sequelize.query(
			`
			SELECT 
				indexname,
				indexdef
			FROM pg_indexes 
			WHERE tablename = 'packagestores'
			ORDER BY indexname;
		`,
			{ type: queryInterface.sequelize.QueryTypes.SELECT }
		);

		console.log('\nФинальное состояние индексов:');
		console.table(
			finalIndexes.map((idx) => ({
				name: idx.indexname,
				definition: idx.indexdef.substring(0, 80) + '...',
			}))
		);

		// Выводим рекомендации по использованию индексов
		console.log(
			'\n📋 Рекомендации по использованию индексов для отложенных событий:'
		);
		console.log(
			'1. packagestore_deferred_check_idx - основной индекс для проверки отложенных событий'
		);
		console.log(
			'2. packagestore_available_packages_idx - для поиска доступных пакетов пользователя'
		);
		console.log(
			'3. packagestore_batch_processing_idx - для пакетной обработки событий'
		);
		console.log('4. packagestore_time_based_idx - для временных проверок');
	},

	async down(queryInterface, Sequelize) {
		console.log('Удаление индексов таблицы packagestores...');

		// Список индексов для удаления (только те, которые мы создали)
		const indexesToDrop = [
			'packagestore_user_id_idx',
			'packagestore_package_template_id_idx',
			'packagestore_user_package_idx',
			'packagestore_status_used_locked_idx',
			'packagestore_available_packages_idx',
			'packagestore_pending_events_idx',
			'packagestore_created_at_idx',
			'packagestore_updated_at_idx',
			'packagestore_time_based_idx',
			'packagestore_resource_idx',
			'packagestore_currency_idx',
			'packagestore_resource_currency_idx',
			'packagestore_deferred_check_idx',
			'packagestore_batch_processing_idx',
		];

		for (const indexName of indexesToDrop) {
			try {
				await queryInterface.removeIndex('packagestores', indexName);
				console.log(`✓ Удален индекс: ${indexName}`);
			} catch (error) {
				console.error(
					`✗ Ошибка удаления индекса ${indexName}:`,
					error.message
				);
			}
		}
	},
};
