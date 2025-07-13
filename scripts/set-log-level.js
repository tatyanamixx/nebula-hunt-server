#!/usr/bin/env node

/**
 * Скрипт для быстрого переключения уровней логирования
 * Created by Claude on 15.07.2025
 */

const fs = require('fs');
const path = require('path');

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

const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'trace'];

function updateLoggerConfig(level) {
	const configPath = path.join(__dirname, '../config/logger.config.js');

	try {
		let content = fs.readFileSync(configPath, 'utf8');

		// Обновляем уровень для development
		content = content.replace(
			/level:\s*['"`][^'"`]*['"`],\s*\/\/.*debug.*/,
			`level: '${level}', // Уровень ${level} для разработки`
		);

		fs.writeFileSync(configPath, content);
		log(`✅ Обновлен config/logger.config.js: уровень ${level}`, 'green');
		return true;
	} catch (error) {
		log(`❌ Ошибка обновления config: ${error.message}`, 'red');
		return false;
	}
}

function updateEnvFiles(level) {
	const envFiles = ['.env', '.env.development', '.env.test'];

	let updatedCount = 0;

	envFiles.forEach((envFile) => {
		const envPath = path.join(__dirname, '..', envFile);

		if (fs.existsSync(envPath)) {
			try {
				let content = fs.readFileSync(envPath, 'utf8');

				// Обновляем LOG_LEVEL
				const logLevelRegex = /^LOG_LEVEL=.*$/m;
				if (logLevelRegex.test(content)) {
					content = content.replace(
						logLevelRegex,
						`LOG_LEVEL=${level}`
					);
					fs.writeFileSync(envPath, content);
					log(`✅ Обновлен ${envFile}: LOG_LEVEL=${level}`, 'green');
					updatedCount++;
				} else {
					// Добавляем LOG_LEVEL если его нет
					content += `\nLOG_LEVEL=${level}`;
					fs.writeFileSync(envPath, content);
					log(
						`✅ Добавлен в ${envFile}: LOG_LEVEL=${level}`,
						'green'
					);
					updatedCount++;
				}
			} catch (error) {
				log(`❌ Ошибка обновления ${envFile}: ${error.message}`, 'red');
			}
		}
	});

	return updatedCount;
}

function showCurrentLevel() {
	const configPath = path.join(__dirname, '../config/logger.config.js');

	try {
		const content = fs.readFileSync(configPath, 'utf8');
		const match = content.match(/level:\s*['"`]([^'"`]*)['"`]/);

		if (match) {
			log(`📊 Текущий уровень логирования: ${match[1]}`, 'cyan');
		} else {
			log('❌ Не удалось определить текущий уровень', 'red');
		}
	} catch (error) {
		log(`❌ Ошибка чтения конфига: ${error.message}`, 'red');
	}
}

function main() {
	const args = process.argv.slice(2);

	log('🔧 Управление уровнем логирования', 'bright');
	log('=' * 50, 'cyan');

	if (args.length === 0) {
		log('\n📖 Usage:', 'bright');
		log('  node scripts/set-log-level.js <level>', 'cyan');
		log('  node scripts/set-log-level.js --current', 'cyan');

		log('\n📋 Доступные уровни:', 'bright');
		LOG_LEVELS.forEach((level) => {
			log(`  - ${level}`, 'yellow');
		});

		log('\n📋 Examples:', 'bright');
		log('  node scripts/set-log-level.js debug', 'cyan');
		log('  node scripts/set-log-level.js info', 'cyan');
		log('  node scripts/set-log-level.js error', 'cyan');

		return;
	}

	if (args[0] === '--current') {
		showCurrentLevel();
		return;
	}

	const level = args[0].toLowerCase();

	if (!LOG_LEVELS.includes(level)) {
		log(`❌ Неверный уровень: ${level}`, 'red');
		log(`Доступные уровни: ${LOG_LEVELS.join(', ')}`, 'yellow');
		process.exit(1);
	}

	log(`🔧 Устанавливаем уровень логирования: ${level}`, 'bright');

	// Обновляем конфигурацию
	const configUpdated = updateLoggerConfig(level);

	// Обновляем env файлы
	const envFilesUpdated = updateEnvFiles(level);

	if (configUpdated && envFilesUpdated > 0) {
		log(`\n✅ Уровень логирования успешно установлен: ${level}`, 'green');
		log('🔄 Перезапустите сервер для применения изменений', 'yellow');
	} else {
		log('\n⚠️  Изменения применены частично', 'yellow');
	}
}

if (require.main === module) {
	main();
}

module.exports = { updateLoggerConfig, updateEnvFiles, LOG_LEVELS };
