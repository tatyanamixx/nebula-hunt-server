/**
 * Настройка тестового окружения для проекта
 *
 * Этот файл отвечает за:
 * 1. Подключение к тестовой базе данных
 * 2. Условное выполнение миграций (только для интеграционных тестов)
 * 3. Очистку таблиц между тестами
 * 4. Закрытие соединения с базой после выполнения всех тестов
 *
 * Управление миграциями осуществляется через переменную окружения RUN_MIGRATIONS:
 * - Для модульных тестов: RUN_MIGRATIONS=false (по умолчанию)
 * - Для интеграционных тестов: RUN_MIGRATIONS=true
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env файла
dotenv.config();

console.log('Database connection established successfully.');

// Создаем экземпляр Sequelize для тестовой базы данных
// Используем PostgreSQL для тестов, чтобы поддерживать все типы данных
const sequelize = new Sequelize({
	dialect: 'postgres',
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 5432,
	username: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || 'password',
	database: process.env.DB_NAME || 'nebulahunt_test',
	logging: false,
	// Дополнительные настройки для тестов
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
});

/**
 * Функция для выполнения миграций
 * Выполняет миграции для создания схемы базы данных
 * Обрабатывает ошибки, связанные с дублирующимися ключами
 */
async function runMigrations() {
	try {
		// Получаем список файлов миграций
		const migrationsDir = path.join(__dirname, '../migrations');
		const migrationFiles = fs
			.readdirSync(migrationsDir)
			.filter((file) => file.endsWith('.js'))
			.sort();

		// Выполняем каждую миграцию последовательно
		for (const migrationFile of migrationFiles) {
			try {
				const migration = require(path.join(
					migrationsDir,
					migrationFile
				));
				if (typeof migration.up === 'function') {
					await migration.up(
						sequelize.getQueryInterface(),
						Sequelize
					);
				}
			} catch (error) {
				// Игнорируем ошибки о дублирующихся ключах/таблицах
				if (
					!error.message.includes('already exists') &&
					!error.message.includes('duplicate key') &&
					!error.message.includes('relation') &&
					!error.message.includes('does not exist')
				) {
					throw error;
				}
			}
		}
	} catch (error) {
		console.error('Error running migrations:', error);
		throw error;
	}
}

/**
 * Функция для очистки таблиц
 * Очищает все таблицы между тестами для изоляции тестовых случаев
 */
async function clearTables() {
	try {
		const tableNames = await sequelize.getQueryInterface().showAllTables();
		for (const tableName of tableNames) {
			await sequelize.query(`DELETE FROM "${tableName}"`);
		}
	} catch (error) {
		console.error('Error clearing tables:', error);
	}
}

// Определяем, нужно ли выполнять миграции (на основе переменной окружения)
const shouldRunMigrations = process.env.RUN_MIGRATIONS === 'true';

// Выполняем настройку перед всеми тестами
beforeAll(async () => {
	try {
		// Подключаемся к базе данных
		await sequelize.authenticate();

		// Выполняем миграции, если это требуется
		if (shouldRunMigrations) {
			console.log('Running migrations for integration tests');
			await runMigrations();
		} else {
			console.log('Skipping migrations for unit tests');
		}

		// Экспортируем sequelize для использования в тестах
		global.testSequelize = sequelize;
	} catch (error) {
		console.error('Error setting up test environment:', error);
		throw error;
	}
}, 30000); // Увеличиваем таймаут до 30 секунд для миграций

// Очищаем таблицы перед каждым тестом
beforeEach(async () => {
	if (shouldRunMigrations) {
		await clearTables();
	}
});

// Закрываем соединение с базой данных после всех тестов
afterAll(async () => {
	try {
		await sequelize.close();
		console.log('Database connection closed successfully.');
	} catch (error) {
		console.error('Error closing database connection:', error);
	}
});

// Устанавливаем таймаут для всех тестов
jest.setTimeout(10000);

// Экспортируем sequelize для использования в тестах
module.exports = { sequelize };
