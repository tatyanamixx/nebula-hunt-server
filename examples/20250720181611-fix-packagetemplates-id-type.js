'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			console.log(
				'Исправляем тип данных поля id в таблице packagetemplates...'
			);

			// Проверяем текущий тип данных поля id
			const result = await queryInterface.sequelize.query(`
				SELECT data_type 
				FROM information_schema.columns 
				WHERE table_name = 'packagetemplates' 
				AND column_name = 'id'
			`);

			console.log('Текущий тип данных поля id:', result[0][0]?.data_type);

			// Если тип данных не BIGINT, изменяем его
			if (result[0][0]?.data_type !== 'bigint') {
				// Создаем новую таблицу с правильным типом данных
				await queryInterface.sequelize.query(`
					CREATE TABLE packagetemplates_new (
						id BIGSERIAL PRIMARY KEY,
						slug VARCHAR(255) NOT NULL UNIQUE,
						name VARCHAR(255) NOT NULL,
						description TEXT,
						amount INTEGER NOT NULL,
						resource "public"."enum_packagetemplates_resource" NOT NULL,
						price DECIMAL(30,8) NOT NULL,
						currency "public"."enum_packagetemplates_currency" NOT NULL,
						status BOOLEAN DEFAULT true,
						"imageUrl" VARCHAR(255),
						"sortOrder" INTEGER DEFAULT 0,
						category VARCHAR(255),
						"isPromoted" BOOLEAN DEFAULT false,
						"validUntil" TIMESTAMP WITH TIME ZONE,
						"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
						"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
					)
				`);

				// Копируем данные из старой таблицы в новую
				await queryInterface.sequelize.query(`
					INSERT INTO packagetemplates_new (
						id, slug, name, description, amount, resource, price, currency, 
						status, "imageUrl", "sortOrder", category, "isPromoted", "validUntil", 
						"createdAt", "updatedAt"
					)
					SELECT 
						CAST(id AS BIGINT), slug, name, description, amount, resource, price, currency,
						status, "imageUrl", "sortOrder", category, "isPromoted", "validUntil",
						"createdAt", "updatedAt"
					FROM packagetemplates
				`);

				// Удаляем старую таблицу
				await queryInterface.sequelize.query(
					'DROP TABLE packagetemplates'
				);

				// Переименовываем новую таблицу
				await queryInterface.sequelize.query(
					'ALTER TABLE packagetemplates_new RENAME TO packagetemplates'
				);

				// Создаем индексы
				await queryInterface.sequelize.query(`
					CREATE INDEX packagetemplate_status_idx ON packagetemplates (status)
				`);
				await queryInterface.sequelize.query(`
					CREATE INDEX packagetemplate_category_idx ON packagetemplates (category)
				`);
				await queryInterface.sequelize.query(`
					CREATE INDEX packagetemplate_sort_order_idx ON packagetemplates ("sortOrder")
				`);

				console.log('Тип данных поля id успешно изменен на BIGINT');
			} else {
				console.log('Тип данных поля id уже правильный (BIGINT)');
			}
		} catch (error) {
			console.error('Ошибка при исправлении типа данных:', error);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			console.log('Откатываем изменения типа данных поля id...');

			// Проверяем текущий тип данных поля id
			const result = await queryInterface.sequelize.query(`
				SELECT data_type 
				FROM information_schema.columns 
				WHERE table_name = 'packagetemplates' 
				AND column_name = 'id'
			`);

			// Если тип данных BIGINT, возвращаем к VARCHAR
			if (result[0][0]?.data_type === 'bigint') {
				// Создаем новую таблицу с VARCHAR типом данных
				await queryInterface.sequelize.query(`
					CREATE TABLE packagetemplates_old (
						id VARCHAR(255) PRIMARY KEY,
						slug VARCHAR(255) NOT NULL UNIQUE,
						name VARCHAR(255) NOT NULL,
						description TEXT,
						amount INTEGER NOT NULL,
						resource "public"."enum_packagetemplates_resource" NOT NULL,
						price DECIMAL(30,8) NOT NULL,
						currency "public"."enum_packagetemplates_currency" NOT NULL,
						status BOOLEAN DEFAULT true,
						"imageUrl" VARCHAR(255),
						"sortOrder" INTEGER DEFAULT 0,
						category VARCHAR(255),
						"isPromoted" BOOLEAN DEFAULT false,
						"validUntil" TIMESTAMP WITH TIME ZONE,
						"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
						"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
					)
				`);

				// Копируем данные из текущей таблицы в старую
				await queryInterface.sequelize.query(`
					INSERT INTO packagetemplates_old (
						id, slug, name, description, amount, resource, price, currency, 
						status, "imageUrl", "sortOrder", category, "isPromoted", "validUntil", 
						"createdAt", "updatedAt"
					)
					SELECT 
						CAST(id AS VARCHAR(255)), slug, name, description, amount, resource, price, currency,
						status, "imageUrl", "sortOrder", category, "isPromoted", "validUntil",
						"createdAt", "updatedAt"
					FROM packagetemplates
				`);

				// Удаляем текущую таблицу
				await queryInterface.sequelize.query(
					'DROP TABLE packagetemplates'
				);

				// Переименовываем старую таблицу
				await queryInterface.sequelize.query(
					'ALTER TABLE packagetemplates_old RENAME TO packagetemplates'
				);

				// Создаем индексы
				await queryInterface.sequelize.query(`
					CREATE INDEX packagetemplate_status_idx ON packagetemplates (status)
				`);
				await queryInterface.sequelize.query(`
					CREATE INDEX packagetemplate_category_idx ON packagetemplates (category)
				`);
				await queryInterface.sequelize.query(`
					CREATE INDEX packagetemplate_sort_order_idx ON packagetemplates ("sortOrder")
				`);

				console.log('Тип данных поля id возвращен к VARCHAR');
			} else {
				console.log('Тип данных поля id уже VARCHAR');
			}
		} catch (error) {
			console.error('Ошибка при откате изменений:', error);
			throw error;
		}
	},
};
