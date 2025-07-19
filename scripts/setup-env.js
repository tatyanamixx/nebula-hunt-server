#!/usr/bin/env node

/**
 * Script to create environment files
 * Copies example files and helps to set up variables
 * Created by Claude on 15.07.2025
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for console
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
		log(`⚠️  File ${destination} already exists. Skipping.`, 'yellow');
		return false;
	}

	try {
		fs.copyFileSync(source, destination);
		log(`✅ Created file: ${destination}`, 'green');
		return true;
	} catch (error) {
		log(`❌ Error creating ${destination}: ${error.message}`, 'red');
		return false;
	}
}

function updateEnvFile(filePath, updates) {
	if (!fs.existsSync(filePath)) {
		log(`❌ File ${filePath} not found`, 'red');
		return false;
	}

	try {
		let content = fs.readFileSync(filePath, 'utf8');

		// Apply updates
		Object.entries(updates).forEach(([key, value]) => {
			const regex = new RegExp(`^${key}=.*$`, 'm');
			if (regex.test(content)) {
				content = content.replace(regex, `${key}=${value}`);
			} else {
				// Add to the end of the file
				content += `\n${key}=${value}`;
			}
		});

		fs.writeFileSync(filePath, content);
		log(`✅ Updated file: ${filePath}`, 'green');
		return true;
	} catch (error) {
		log(`❌ Error updating ${filePath}: ${error.message}`, 'red');
		return false;
	}
}

function main() {
	log('🚀 Setting up environment files for Nebulahunt Server', 'bright');
	log('=' * 60, 'cyan');

	const envFiles = [
		{ source: 'env.example', dest: '.env' },
		{ source: 'env.development.example', dest: '.env.development' },
		{ source: 'env.test.example', dest: '.env.test' },
		{ source: 'env.production.example', dest: '.env.production' },
	];

	let createdCount = 0;

	// Copy files
	envFiles.forEach(({ source, dest }) => {
		if (copyEnvFile(source, dest)) {
			createdCount++;
		}
	});

	if (createdCount === 0) {
		log('\n⚠️  All environment files already exist.', 'yellow');
		log('To update secrets, use: npm run security:check', 'cyan');
		return;
	}

	log(`\n✅ Created files: ${createdCount}`, 'green');

	// Generate secure secrets
	const secureSecrets = {
		JWT_ACCESS_SECRET: generateSecureSecret(64),
		JWT_REFRESH_SECRET: generateSecureSecret(64),
		ADMIN_INIT_SECRET: generateSecureSecret(32),
	};

	log('\n🔐 Generating secure secrets...', 'cyan');

	// Update main files with secrets
	const filesToUpdate = ['.env', '.env.development', '.env.test'];

	filesToUpdate.forEach((file) => {
		if (fs.existsSync(file)) {
			updateEnvFile(file, secureSecrets);
		}
	});

	log('\n📋 Next steps:', 'bright');
	log('1. Edit created .env* files', 'cyan');
	log('2. Set real values for:', 'cyan');
	log('   - BOT_TOKEN (Telegram bot token)', 'yellow');
	log('   - DB_PASSWORD_* (database passwords)', 'yellow');
	log('   - TON_API_KEY (TON API key)', 'yellow');
	log('   - REDIS_PASSWORD (Redis password)', 'yellow');
	log('3. Check security: npm run security:check', 'cyan');
	log('4. Start the application: npm run dev', 'cyan');

	log('\n⚠️  IMPORTANT: Never commit .env* files to git!', 'red');
	log('They are already added to .gitignore', 'green');
}

if (require.main === module) {
	main();
}

module.exports = { copyEnvFile, updateEnvFile, generateSecureSecret };
