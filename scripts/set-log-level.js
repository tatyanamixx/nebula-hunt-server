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
			`level: '${level}', // Level ${level} for development`
		);

		fs.writeFileSync(configPath, content);
		log(`✅ Updated config/logger.config.js: level ${level}`, 'green');
		return true;
	} catch (error) {
		log(`❌ Error updating config: ${error.message}`, 'red');
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
					log(`✅ Updated ${envFile}: LOG_LEVEL=${level}`, 'green');
					updatedCount++;
				} else {
					// Добавляем LOG_LEVEL если его нет
					content += `\nLOG_LEVEL=${level}`;
					fs.writeFileSync(envPath, content);
					log(`✅ Added to ${envFile}: LOG_LEVEL=${level}`, 'green');
					updatedCount++;
				}
			} catch (error) {
				log(`❌ Error updating ${envFile}: ${error.message}`, 'red');
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
			log(`📊 Current log level: ${match[1]}`, 'cyan');
		} else {
			log('❌ Failed to determine current log level', 'red');
		}
	} catch (error) {
		log(`❌ Error reading config: ${error.message}`, 'red');
	}
}

function main() {
	const args = process.argv.slice(2);

	log('🔧 Managing log level', 'bright');
	log('=' * 50, 'cyan');

	if (args.length === 0) {
		log('\n📖 Usage:', 'bright');
		log('  node scripts/set-log-level.js <level>', 'cyan');
		log('  node scripts/set-log-level.js --current', 'cyan');

		log('\n📋 Available levels:', 'bright');
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
		log(`❌ Invalid level: ${level}`, 'red');
		log(`Available levels: ${LOG_LEVELS.join(', ')}`, 'yellow');
		process.exit(1);
	}

	log(`🔧 Setting log level: ${level}`, 'bright');

	// Обновляем конфигурацию
	const configUpdated = updateLoggerConfig(level);

	// Обновляем env файлы
	const envFilesUpdated = updateEnvFiles(level);

	if (configUpdated && envFilesUpdated > 0) {
		log(`\n✅ Log level successfully set: ${level}`, 'green');
		log('🔄 Restart the server to apply changes', 'yellow');
	} else {
		log('\n⚠️  Changes applied partially', 'yellow');
	}
}

if (require.main === module) {
	main();
}

module.exports = { updateLoggerConfig, updateEnvFiles, LOG_LEVELS };
