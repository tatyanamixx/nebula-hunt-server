#!/usr/bin/env node

/**
 * Скрипт для создания файлов окружения
 * Копирует примеры файлов и помогает настроить переменные
 * Created by Claude on 15.07.2025
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Цвета для консоли
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecureSecret(length = 64) {
	return crypto.randomBytes(length).toString('hex');
}

function copyEnvFile(source, destination) {
	if (fs.existsSync(destination)) {
		log(`⚠️  Файл ${destination} уже существует. Пропускаем.`, 'yellow');
		return false;
	}

	try {
		fs.copyFileSync(source, destination);
		log(`✅ Создан файл: ${destination}`, 'green');
		return true;
	} catch (error) {
		log(`❌ Ошибка при создании ${destination}: ${error.message}`, 'red');
		return false;
	}
}

function updateEnvFile(filePath, updates) {
	if (!fs.existsSync(filePath)) {
		log(`❌ Файл ${filePath} не найден`, 'red');
		return false;
	}

	try {
		let content = fs.readFileSync(filePath, 'utf8');

		// Применяем обновления
		Object.entries(updates).forEach(([key, value]) => {
			const regex = new RegExp(`^${key}=.*$`, 'm');
			if (regex.test(content)) {
				content = content.replace(regex, `${key}=${value}`);
			} else {
				// Добавляем в конец файла
				content += `\n${key}=${value}`;
			}
		});

		fs.writeFileSync(filePath, content);
		log(`✅ Обновлен файл: ${filePath}`, 'green');
		return true;
	} catch (error) {
		log(`❌ Ошибка при обновлении ${filePath}: ${error.message}`, 'red');
		return false;
	}
}

function main() {
	log('🚀 Настройка файлов окружения Nebulahunt Server', 'bright');
	log('=' * 60, 'cyan');

	const envFiles = [
		{ source: 'env.example', dest: '.env' },
		{ source: 'env.development.example', dest: '.env.development' },
		{ source: 'env.test.example', dest: '.env.test' },
		{ source: 'env.production.example', dest: '.env.production' },
	];

	let createdCount = 0;

	// Копируем файлы
	envFiles.forEach(({ source, dest }) => {
		if (copyEnvFile(source, dest)) {
			createdCount++;
		}
	});

	if (createdCount === 0) {
		log('\n⚠️  Все файлы окружения уже существуют.', 'yellow');
		log(
			'Для обновления секретов используйте: npm run security:check',
			'cyan'
		);
		return;
	}

	log(`\n✅ Создано файлов: ${createdCount}`, 'green');

	// Генерируем безопасные секреты
	const secureSecrets = {
		JWT_ACCESS_SECRET: generateSecureSecret(64),
		JWT_REFRESH_SECRET: generateSecureSecret(64),
		ADMIN_INIT_SECRET: generateSecureSecret(32),
	};

	log('\n🔐 Генерируем безопасные секреты...', 'cyan');

	// Обновляем основные файлы с секретами
	const filesToUpdate = ['.env', '.env.development', '.env.test'];

	filesToUpdate.forEach((file) => {
		if (fs.existsSync(file)) {
			updateEnvFile(file, secureSecrets);
		}
	});

	log('\n📋 Следующие шаги:', 'bright');
	log('1. Отредактируйте созданные файлы .env*', 'cyan');
	log('2. Установите реальные значения для:', 'cyan');
	log('   - BOT_TOKEN (токен Telegram бота)', 'yellow');
	log('   - DB_PASSWORD_* (пароли базы данных)', 'yellow');
	log('   - TON_API_KEY (ключ TON API)', 'yellow');
	log('   - REDIS_PASSWORD (пароль Redis)', 'yellow');
	log('3. Проверьте безопасность: npm run security:check', 'cyan');
	log('4. Запустите приложение: npm run dev', 'cyan');

	log('\n⚠️  ВАЖНО: Никогда не коммитьте файлы .env* в git!', 'red');
	log('Они уже добавлены в .gitignore', 'green');
}

if (require.main === module) {
	main();
}

module.exports = { copyEnvFile, updateEnvFile, generateSecureSecret };
