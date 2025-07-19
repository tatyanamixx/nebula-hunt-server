#!/usr/bin/env node

/**
 * Script to check the security of environment variables
 * Checks for the presence of all required variables and their security
 * Created by Claude on 15.07.2025
 */

const fs = require('fs');
const path = require('path');

// List of critical variables
const CRITICAL_VARS = [
	'JWT_ACCESS_SECRET',
	'JWT_REFRESH_SECRET',
	'BOT_TOKEN',
	'ADMIN_INIT_SECRET',
];

// List of variables with unsafe default values
const UNSAFE_DEFAULTS = {
	JWT_ACCESS_SECRET: ['dev_access_secret_key', 'test_access_secret_key'],
	JWT_REFRESH_SECRET: ['dev_refresh_secret_key', 'test_refresh_secret_key'],
	BOT_TOKEN: ['your_telegram_bot_token', 'test_telegram_bot_token'],
	ADMIN_INIT_SECRET: ['supersecret'],
	DB_PASSWORD: ['postgres', 'password'],
	DB_PASSWORD_DEV: ['09160130'],
	DB_PASSWORD_TEST: ['09160130'],
};

// List of all environment variables from the code
const ALL_ENV_VARS = [
	// Main settings
	'NODE_ENV',
	'PORT',
	'LOG_LEVEL',
	'LOG_FILE_PATH',

	// Database - common
	'DB_HOST',
	'DB_PORT',
	'DB_NAME',
	'DB_USER',
	'DB_PASSWORD',

	// Database - development
	'DB_HOST_DEV',
	'DB_PORT_DEV',
	'DB_NAME_DEV',
	'DB_USER_DEV',
	'DB_PASSWORD_DEV',
	'DB_LOGGING',

	// Database - test
	'DB_HOST_TEST',
	'DB_PORT_TEST',
	'DB_NAME_TEST',
	'DB_USER_TEST',
	'DB_PASSWORD_TEST',

	// Database - production
	'DB_HOST_PROD',
	'DB_PORT_PROD',
	'DB_NAME_PROD',
	'DB_USER_PROD',
	'DB_PASSWORD_PROD',

	// SSL settings
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

	// Security
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

	// Monitoring
	'PROMETHEUS_PORT',
	'METRICS_ENABLED',

	// External services
	'TON_NETWORK',
	'TON_API_KEY',
	'TON_WALLET_ADDRESS',

	// Migrations
	'RUN_MIGRATIONS',
];

function checkEnvFile(envPath) {
	console.log(`\n🔍 Checking file: ${envPath}`);

	if (!fs.existsSync(envPath)) {
		console.log(`❌ File not found: ${envPath}`);
		return { exists: false, issues: [] };
	}

	const content = fs.readFileSync(envPath, 'utf8');
	const lines = content.split('\n');
	const issues = [];
	const foundVars = new Set();

	// Check each line
	lines.forEach((line, index) => {
		const trimmedLine = line.trim();

		// Skip comments and empty lines
		if (trimmedLine.startsWith('#') || trimmedLine === '') {
			return;
		}

		// Parse variable
		const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
		if (match) {
			const [, varName, value] = match;
			foundVars.add(varName);

			// Check critical variables
			if (CRITICAL_VARS.includes(varName)) {
				if (!value || value === '') {
					issues.push(`🚨 CRITICAL: ${varName} not set`);
				} else if (
					UNSAFE_DEFAULTS[varName] &&
					UNSAFE_DEFAULTS[varName].includes(value)
				) {
					issues.push(
						`⚠️  UNSAFE: ${varName} uses default value: ${value}`
					);
				}
			}

			// Check unsafe default values
			if (
				UNSAFE_DEFAULTS[varName] &&
				UNSAFE_DEFAULTS[varName].includes(value)
			) {
				issues.push(
					`⚠️  UNSAFE: ${varName} uses default value: ${value}`
				);
			}

			// Check production environment
			if (process.env.NODE_ENV === 'production') {
				if (
					varName.includes('PASSWORD') &&
					(value === 'postgres' || value === 'password')
				) {
					issues.push(
						`🚨 CRITICAL: ${varName} uses unsafe password in production`
					);
				}
			}
		}
	});

	// Check for missing critical variables
	CRITICAL_VARS.forEach((varName) => {
		if (!foundVars.has(varName)) {
			issues.push(`❌ MISSING: ${varName} not defined`);
		}
	});

	return { exists: true, issues, foundVars };
}

function main() {
	console.log('🔒 Checking environment variables security\n');

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
				console.log('✅ Security in order');
			} else {
				result.issues.forEach((issue) => {
					console.log(issue);
					totalIssues++;
					if (issue.includes('🚨 CRITICAL')) {
						hasCriticalIssues = true;
					}
				});
			}
		}
	});

	console.log('\n📊 Check results:');
	console.log(`- Total issues: ${totalIssues}`);

	if (hasCriticalIssues) {
		console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND!');
		console.log('Fix them before deploying to production.');
		process.exit(1);
	} else if (totalIssues > 0) {
		console.log(
			'\n⚠️  Security issues found. It is recommended to fix them.'
		);
		process.exit(1);
	} else {
		console.log('\n✅ All checks passed successfully!');
	}
}

if (require.main === module) {
	main();
}

module.exports = { checkEnvFile, CRITICAL_VARS, UNSAFE_DEFAULTS };
