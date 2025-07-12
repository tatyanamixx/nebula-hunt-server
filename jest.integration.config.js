module.exports = {
	// Корневая директория для поиска тестов
	rootDir: '.',

	// Шаблоны для поиска интеграционных тестов
	testMatch: ['**/tests/integration/**/*.test.js'],

	// Игнорируемые директории
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

	// Окружение для тестов
	testEnvironment: 'node',

	// Файл для настройки тестового окружения
	setupFilesAfterEnv: ['./tests/setup.js'],

	// Настройки покрытия кода для интеграционных тестов
	collectCoverageFrom: [
		'controllers/**/*.js',
		'service/**/*.js',
		'models/**/*.js',
		'!**/node_modules/**',
		'!**/tests/**',
	],

	// Порог покрытия кода для интеграционных тестов
	coverageThreshold: {
		global: {
			branches: 60,
			functions: 60,
			lines: 60,
			statements: 60,
		},
	},

	// Форматы отчетов о покрытии
	coverageReporters: ['text', 'lcov', 'html'],

	// Увеличенный таймаут для интеграционных тестов (60 секунд)
	testTimeout: 60000,

	// Максимальное количество одновременно выполняемых тестов
	maxConcurrency: 3,

	// Отображение подробной информации о тестах
	verbose: true,

	// Настройки для параллельного выполнения
	maxWorkers: 3,

	// Отображение прогресса выполнения тестов
	verbose: true,

	// Настройки для отладки
	detectOpenHandles: true,
	forceExit: true,
};
