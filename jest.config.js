module.exports = {
	// Корневая директория для поиска тестов
	rootDir: '.',

	// Шаблоны для поиска тестовых файлов
	testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],

	// Игнорируемые директории
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

	// Окружение для тестов
	testEnvironment: 'node',

	// Файл для настройки тестового окружения
	setupFilesAfterEnv: ['./tests/setup.js'],

	// Настройки покрытия кода
	collectCoverageFrom: [
		'controllers/**/*.js',
		'service/**/*.js',
		'middlewares/**/*.js',
		'models/**/*.js',
		'!**/node_modules/**',
		'!**/tests/**',
	],

	// Порог покрытия кода
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},

	// Форматы отчетов о покрытии
	coverageReporters: ['text', 'lcov', 'clover', 'html'],

	// Таймаут для тестов (30 секунд)
	testTimeout: 30000,

	// Максимальное количество одновременно выполняемых тестов
	maxConcurrency: 5,

	// Отображение подробной информации о тестах
	verbose: true,
};
