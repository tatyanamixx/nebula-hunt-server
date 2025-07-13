#!/usr/bin/env node

/**
 * Утилита для декодирования и тестирования Telegram initData
 * Created by Claude on 15.07.2025
 */

const { parse, validate } = require('@telegram-apps/init-data-node');
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

/**
 * Декодирует initData из различных форматов
 */
function decodeInitData(rawData) {
	if (!rawData) return null;

	try {
		// Если это уже URL-encoded строка (прямой формат)
		if (rawData.includes('=') && rawData.includes('&')) {
			log('✅ Detected direct URL-encoded format', 'green');
			return rawData;
		}

		// Если это base64 encoded строка
		if (rawData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
			log('✅ Detected base64 encoded format', 'green');
			const decoded = Buffer.from(rawData, 'base64').toString('utf-8');
			log('📄 Base64 decoded:', 'cyan');
			console.log(decoded);
			return decoded;
		}

		// Если это JSON строка
		if (rawData.startsWith('{') || rawData.startsWith('[')) {
			log('✅ Detected JSON format', 'green');
			return rawData;
		}

		log('❌ Unknown initData format', 'red');
		return null;
	} catch (error) {
		log(`❌ Error decoding initData: ${error.message}`, 'red');
		return null;
	}
}

/**
 * Анализирует и валидирует initData
 */
function analyzeInitData(initData, botToken) {
	log('\n🔍 Analyzing initData...', 'bright');

	try {
		// Парсим данные
		const parsed = parse(initData);

		log('✅ Parsing successful!', 'green');
		log('\n📊 Parsed data:', 'cyan');
		console.log(JSON.stringify(parsed, null, 2));

		// Валидируем подпись
		if (botToken) {
			try {
				validate(initData, botToken);
				log('✅ Signature validation successful!', 'green');
			} catch (validationError) {
				log(
					`❌ Signature validation failed: ${validationError.message}`,
					'red'
				);
				log('💡 Make sure BOT_TOKEN is correct', 'yellow');
			}
		} else {
			log('⚠️  No BOT_TOKEN provided, skipping validation', 'yellow');
		}

		return parsed;
	} catch (parseError) {
		log(`❌ Parsing failed: ${parseError.message}`, 'red');
		return null;
	}
}

/**
 * Создает тестовые данные для демонстрации
 */
function createTestData() {
	log('\n🧪 Creating test data...', 'bright');

	// Пример URL-encoded initData (без подписи)
	const testInitData =
		'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1640995200&hash=test_hash';

	log('📝 Test URL-encoded initData:', 'cyan');
	console.log(testInitData);

	// Base64 encoded версия
	const base64Encoded = Buffer.from(testInitData).toString('base64');
	log('\n📝 Test base64 encoded initData:', 'cyan');
	console.log(base64Encoded);

	return { testInitData, base64Encoded };
}

function main() {
	const args = process.argv.slice(2);

	log('🚀 Telegram initData Decoder', 'bright');
	log('=' * 50, 'cyan');

	if (args.length === 0) {
		log('\n📖 Usage:', 'bright');
		log('  node scripts/decode-telegram-initdata.js <initData>', 'cyan');
		log('  node scripts/decode-telegram-initdata.js --test', 'cyan');
		log(
			'  node scripts/decode-telegram-initdata.js --base64 <base64Data>',
			'cyan'
		);

		log('\n📋 Examples:', 'bright');
		log('  # Decode URL-encoded initData', 'cyan');
		log(
			'  node scripts/decode-telegram-initdata.js "user=...&auth_date=...&hash=..."',
			'yellow'
		);

		log('  # Decode base64 encoded initData', 'cyan');
		log(
			'  node scripts/decode-telegram-initdata.js --base64 "dXNlcj0..."',
			'yellow'
		);

		log('  # Show test data', 'cyan');
		log('  node scripts/decode-telegram-initdata.js --test', 'yellow');

		return;
	}

	if (args[0] === '--test') {
		const { testInitData, base64Encoded } = createTestData();

		log('\n🔍 Testing URL-encoded format:', 'bright');
		const decoded1 = decodeInitData(testInitData);
		if (decoded1) {
			analyzeInitData(decoded1, process.env.BOT_TOKEN);
		}

		log('\n🔍 Testing base64 format:', 'bright');
		const decoded2 = decodeInitData(base64Encoded);
		if (decoded2) {
			analyzeInitData(decoded2, process.env.BOT_TOKEN);
		}

		return;
	}

	if (args[0] === '--base64' && args[1]) {
		log('🔍 Processing base64 encoded data...', 'bright');
		const decoded = decodeInitData(args[1]);
		if (decoded) {
			analyzeInitData(decoded, process.env.BOT_TOKEN);
		}
		return;
	}

	// Обычный режим - декодируем переданные данные
	const inputData = args[0];
	log(`🔍 Processing input data (${inputData.length} chars)...`, 'bright');

	const decoded = decodeInitData(inputData);
	if (decoded) {
		analyzeInitData(decoded, process.env.BOT_TOKEN);
	} else {
		log('❌ Failed to decode initData', 'red');
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

module.exports = { decodeInitData, analyzeInitData };
