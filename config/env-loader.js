const path = require('path');
const fs = require('fs');

/**
 * Loads environment variables with support for .env.local
 * Loading priority:
 * 1. .env.local (local settings, not in git)
 * 2. .env (main settings)
 * 3. System environment variables
 */
function loadEnvironmentVariables() {
	const projectRoot = path.resolve(__dirname, '..');

	// List of files to load in order of priority
	const envFiles = [
		'.env.local', // Local settings (highest priority)
		'.env', // Main settings
	];

	console.log('🔧 Loading environment variables...');

	// Load files in reverse order (dotenv loads the last file first)
	for (let i = envFiles.length - 1; i >= 0; i--) {
		const envFile = envFiles[i];
		const envPath = path.join(projectRoot, envFile);

		if (fs.existsSync(envPath)) {
			console.log(`   ✅ Loaded ${envFile}`);

			// Load file through dotenv
			require('dotenv').config({ path: envPath });
		} else {
			console.log(`   ⚠️  ${envFile} not found`);
		}
	}

	// Check that NODE_ENV is set
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = 'development';
		console.log('   ℹ️  NODE_ENV set to development');
	}

	console.log(`   🌍 Environment: ${process.env.NODE_ENV}`);
	console.log('   ✅ Environment variables loaded\n');
}

/**
 * Get environment variable value with fallback
 * @param {string} key - Variable key
 * @param {string} defaultValue - Default value
 * @returns {string} Variable value
 */
function getEnv(key, defaultValue = '') {
	return process.env[key] || defaultValue;
}

/**
 * Get environment variable value as boolean
 * @param {string} key - Variable key
 * @param {boolean} defaultValue - Default value
 * @returns {boolean} Variable value
 */
function getEnvBool(key, defaultValue = false) {
	const value = process.env[key];
	if (value === undefined || value === '') {
		return defaultValue;
	}
	return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get environment variable value as number
 * @param {string} key - Variable key
 * @param {number} defaultValue - Default value
 * @returns {number} Variable value
 */
function getEnvNumber(key, defaultValue = 0) {
	const value = process.env[key];
	if (value === undefined || value === '') {
		return defaultValue;
	}
	const num = parseInt(value, 10);
	return isNaN(num) ? defaultValue : num;
}

/**
 * Check that all required environment variables are loaded
 * @returns {Object} Result of the check
 */
function validateEnvironment() {
	const required = [
		'NODE_ENV',
		'PORT',
		'JWT_ACCESS_SECRET',
		'JWT_REFRESH_SECRET',
		'BOT_TOKEN',
	];

	const missing = [];
	const warnings = [];

	required.forEach((key) => {
		if (!process.env[key]) {
			missing.push(key);
		}
	});

	// Check database variables for the current environment
	const env = process.env.NODE_ENV || 'development';
	const dbVars = [
		`DB_HOST_${env.toUpperCase()}`,
		`DB_NAME_${env.toUpperCase()}`,
		`DB_USER_${env.toUpperCase()}`,
		`DB_PASSWORD_${env.toUpperCase()}`,
	];

	dbVars.forEach((key) => {
		if (
			!process.env[key] &&
			!process.env[key.replace(`_${env.toUpperCase()}`, '')]
		) {
			warnings.push(key);
		}
	});

	return {
		isValid: missing.length === 0,
		missing,
		warnings,
		env,
	};
}

/**
 * Print information about loaded environment variables
 */
function printEnvironmentInfo() {
	const env = process.env.NODE_ENV || 'development';

	console.log('📋 Environment variables information:');
	console.log(`   Environment: ${env}`);
	console.log(`   Port: ${process.env.PORT || 'not set'}`);
	console.log(
		`   Logging level: ${process.env.LOG_LEVEL || 'not set'}`
	);

	// Show database settings for the current environment
	const dbHost =
		process.env[`DB_HOST_${env.toUpperCase()}`] || process.env.DB_HOST;
	const dbName =
		process.env[`DB_NAME_${env.toUpperCase()}`] || process.env.DB_NAME;
	const dbUser =
		process.env[`DB_USER_${env.toUpperCase()}`] || process.env.DB_USER;

	console.log(`   Database: ${dbName || 'not set'}`);
	console.log(`   DB Host: ${dbHost || 'not set'}`);
	console.log(`   DB User: ${dbUser || 'not set'}`);

	// Check that secrets are set
	const hasJwtAccess = !!process.env.JWT_ACCESS_SECRET;
	const hasJwtRefresh = !!process.env.JWT_REFRESH_SECRET;
	const hasBotToken = !!process.env.BOT_TOKEN;

	console.log(
		`   JWT Access Secret: ${
			hasJwtAccess ? '✅ set' : '❌ not set'
		}`
	);
	console.log(
		`   JWT Refresh Secret: ${
			hasJwtRefresh ? '✅ set' : '❌ not set'
		}`
	);
	console.log(
		`   Bot Token: ${hasBotToken ? '✅ set' : '❌ not set'}`
	);

	console.log('');
}

module.exports = {
	loadEnvironmentVariables,
	getEnv,
	getEnvBool,
	getEnvNumber,
	validateEnvironment,
	printEnvironmentInfo,
};
