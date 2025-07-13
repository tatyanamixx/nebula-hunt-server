#!/usr/bin/env node

/**
 * Скрипт для проверки безопасности переменных окружения
 * Проверяет наличие всех необходимых переменных и их безопасность
 * Created by Claude on 15.07.2025
 */

const fs = require('fs');
const path = require('path');

// Список критически важных переменных
const CRITICAL_VARS = [
	'JWT_ACCESS_SECRET',
	'JWT_REFRESH_SECRET',
	'BOT_TOKEN',
	'ADMIN_INIT_SECRET',
];

// Список переменных с небезопасными значениями по умолчанию
const UNSAFE_DEFAULTS = {
	JWT_ACCESS_SECRET: ['dev_access_secret_key', 'test_access_secret_key'],
	JWT_REFRESH_SECRET: ['dev_refresh_secret_key', 'test_refresh_secret_key'],
	BOT_TOKEN: ['your_telegram_bot_token', 'test_telegram_bot_token'],
	ADMIN_INIT_SECRET: ['supersecret'],
	DB_PASSWORD: ['postgres', 'password'],
	DB_PASSWORD_DEV: ['09160130'],
	DB_PASSWORD_TEST: ['09160130'],
};

// Список всех переменных окружения из кода
const ALL_ENV_VARS = [
	// Основные настройки
	'NODE_ENV',
	'PORT',
	'LOG_LEVEL',
	'LOG_FILE_PATH',

	// База данных - общие
	'DB_HOST',
	'DB_PORT',
	'DB_NAME',
	'DB_USER',
	'DB_PASSWORD',

	// База данных - development
	'DB_HOST_DEV',
	'DB_PORT_DEV',
	'DB_NAME_DEV',
	'DB_USER_DEV',
	'DB_PASSWORD_DEV',
	'DB_LOGGING',

	// База данных - test
	'DB_HOST_TEST',
	'DB_PORT_TEST',
	'DB_NAME_TEST',
	'DB_USER_TEST',
	'DB_PASSWORD_TEST',

	// База данных - production
	'DB_HOST_PROD',
	'DB_PORT_PROD',
	'DB_NAME_PROD',
	'DB_USER_PROD',
	'DB_PASSWORD_PROD',

	// SSL настройки
	'DB_SSL',
	'DB_SSL_CA_PATH',
	'DB_SSL_CERT_PATH',
	'DB_SSL_KEY_PATH',
	'DB_SSL_REJECT_UNAUTHORIZED',

	// Redis
	'REDIS_HOST',
	'REDIS_PORT',
	'REDIS_PASSWORD',

	// JWT
	'JWT_ACCESS_SECRET',
	'JWT_REFRESH_SECRET',
	'JWT_ACCESS_EXPIRES_IN',
	'JWT_REFRESH_EXPIRES_IN',

	// Telegram
	'BOT_TOKEN',
	'TELEGRAM_WEBHOOK_URL',

	// Безопасность
	'ADMIN_IDS',
	'SYSTEM_USER_ID',
	'ADMIN_INIT_SECRET',
	'RATE_LIMIT_WINDOW_MS',
	'RATE_LIMIT_MAX',
	'CORS_ORIGIN',
	'CLIENT_URL',
	'ALLOWED_ORIGINS',
	'BLACKLISTED_IPS',
	'ADMIN_WHITELISTED_IPS',
	'ADMIN_IP_RESTRICTION',

	// Мониторинг
	'PROMETHEUS_PORT',
	'METRICS_ENABLED',

	// Внешние сервисы
	'TON_NETWORK',
	'TON_API_KEY',
	'TON_WALLET_ADDRESS',

	// Миграции
	'RUN_MIGRATIONS',
];

function checkEnvFile(envPath) {
	console.log(`\n🔍 Проверка файла: ${envPath}`);

	if (!fs.existsSync(envPath)) {
		console.log(`❌ Файл не найден: ${envPath}`);
		return { exists: false, issues: [] };
	}

	const content = fs.readFileSync(envPath, 'utf8');
	const lines = content.split('\n');
	const issues = [];
	const foundVars = new Set();

	// Проверяем каждую строку
	lines.forEach((line, index) => {
		const trimmedLine = line.trim();

		// Пропускаем комментарии и пустые строки
		if (trimmedLine.startsWith('#') || trimmedLine === '') {
			return;
		}

		// Парсим переменную
		const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
		if (match) {
			const [, varName, value] = match;
			foundVars.add(varName);

			// Проверяем критические переменные
			if (CRITICAL_VARS.includes(varName)) {
				if (!value || value === '') {
					issues.push(`🚨 КРИТИЧНО: ${varName} не установлена`);
				} else if (
					UNSAFE_DEFAULTS[varName] &&
					UNSAFE_DEFAULTS[varName].includes(value)
				) {
					issues.push(
						`⚠️  НЕБЕЗОПАСНО: ${varName} использует значение по умолчанию: ${value}`
					);
				}
			}

			// Проверяем небезопасные значения по умолчанию
			if (
				UNSAFE_DEFAULTS[varName] &&
				UNSAFE_DEFAULTS[varName].includes(value)
			) {
				issues.push(
					`⚠️  НЕБЕЗОПАСНО: ${varName} использует значение по умолчанию: ${value}`
				);
			}

			// Проверяем production окружение
			if (process.env.NODE_ENV === 'production') {
				if (
					varName.includes('PASSWORD') &&
					(value === 'postgres' || value === 'password')
				) {
					issues.push(
						`🚨 КРИТИЧНО: ${varName} использует небезопасный пароль в production`
					);
				}
			}
		}
	});

	// Проверяем отсутствующие критические переменные
	CRITICAL_VARS.forEach((varName) => {
		if (!foundVars.has(varName)) {
			issues.push(`❌ ОТСУТСТВУЕТ: ${varName} не определена`);
		}
	});

	return { exists: true, issues, foundVars };
}

function main() {
	console.log('🔒 Проверка безопасности переменных окружения\n');

	const envFiles = [
		'.env',
		'.env.development',
		'.env.test',
		'.env.production',
		'.env.local',
	];

	let totalIssues = 0;
	let hasCriticalIssues = false;

	envFiles.forEach((envFile) => {
		const result = checkEnvFile(envFile);

		if (result.exists) {
			if (result.issues.length === 0) {
				console.log('✅ Безопасность в порядке');
			} else {
				result.issues.forEach((issue) => {
					console.log(issue);
					totalIssues++;
					if (issue.includes('🚨 КРИТИЧНО')) {
						hasCriticalIssues = true;
					}
				});
			}
		}
	});

	console.log('\n📊 Результаты проверки:');
	console.log(`- Всего проблем: ${totalIssues}`);

	if (hasCriticalIssues) {
		console.log('\n🚨 ОБНАРУЖЕНЫ КРИТИЧЕСКИЕ ПРОБЛЕМЫ БЕЗОПАСНОСТИ!');
		console.log('Немедленно исправьте их перед деплоем в production.');
		process.exit(1);
	} else if (totalIssues > 0) {
		console.log(
			'\n⚠️  Обнаружены проблемы безопасности. Рекомендуется исправить.'
		);
		process.exit(1);
	} else {
		console.log('\n✅ Все проверки пройдены успешно!');
	}
}

if (require.main === module) {
	main();
}

module.exports = { checkEnvFile, CRITICAL_VARS, UNSAFE_DEFAULTS };
