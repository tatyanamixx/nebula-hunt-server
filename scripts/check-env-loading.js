#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking environment variable loading...\n');

// Check for .env file
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

console.log('📁 Environment files:');
console.log(`   .env: ${fs.existsSync(envPath) ? '✅ found' : '❌ not found'}`);
console.log(
	`   env.example: ${
		fs.existsSync(envExamplePath) ? '✅ found' : '❌ not found'
	}`
);

const {
	loadEnvironmentVariables,
	validateEnvironment,
	printEnvironmentInfo,
} = require('../config/env-loader');

// Load environment variables with support for .env.local
loadEnvironmentVariables();

// Check the validity of environment variables
const validation = validateEnvironment();
console.log(`\n🌍 Current environment: ${validation.env}`);

if (!validation.isValid) {
	console.log('\n❌ Missing required environment variables:');
	validation.missing.forEach((key) => {
		console.log(`   - ${key}`);
	});
}

if (validation.warnings.length > 0) {
	console.log('\n⚠️  Warnings:');
	validation.warnings.forEach((key) => {
		console.log(`   - ${key} (may not be set)`);
	});
}

// Check basic environment variables
console.log('\n📋 Basic environment variables:');
const basicVars = ['NODE_ENV', 'PORT', 'LOG_LEVEL', 'LOG_FILE_PATH'];

basicVars.forEach((varName) => {
	const value = process.env[varName];
	console.log(`   ${varName}: ${value ? `✅ ${value}` : '❌ not set'}`);
});

// Check database variables
console.log('\n🗄️  Database variables:');
const dbVars = [
	'DB_HOST',
	'DB_PORT',
	'DB_NAME',
	'DB_USER',
	'DB_PASSWORD',
	'DB_LOGGING',
];

dbVars.forEach((varName) => {
	const value = process.env[varName];
	console.log(`   ${varName}: ${value ? `✅ ${value}` : '❌ not set'}`);
});

// Check environment-specific variables
console.log(`\n🔧 Environment-specific variables for ${validation.env}:`);
const envSpecificVars = [
	`DB_HOST_${validation.env.toUpperCase()}`,
	`DB_PORT_${validation.env.toUpperCase()}`,
	`DB_NAME_${validation.env.toUpperCase()}`,
	`DB_USER_${validation.env.toUpperCase()}`,
	`DB_PASSWORD_${validation.env.toUpperCase()}`,
];

envSpecificVars.forEach((varName) => {
	const value = process.env[varName];
	console.log(`   ${varName}: ${value ? `✅ ${value}` : '❌ not set'}`);
});

// Check JWT variables
console.log('\n🔐 JWT variables:');
const jwtVars = [
	'JWT_ACCESS_SECRET',
	'JWT_REFRESH_SECRET',
	'JWT_ACCESS_EXPIRES_IN',
	'JWT_REFRESH_EXPIRES_IN',
	'JWT_ISSUER',
	'JWT_ACCESS_AUDIENCE',
	'JWT_REFRESH_AUDIENCE',
];

jwtVars.forEach((varName) => {
	const value = process.env[varName];
	console.log(
		`   ${varName}: ${
			value ? `✅ ${value.substring(0, 10)}...` : '❌ not set'
		}`
	);
});

// Check Telegram variables
console.log('\n🤖 Telegram variables:');
const telegramVars = ['BOT_TOKEN', 'TELEGRAM_WEBHOOK_URL'];

telegramVars.forEach((varName) => {
	const value = process.env[varName];
	console.log(
		`   ${varName}: ${
			value ? `✅ ${value.substring(0, 10)}...` : '❌ not set'
		}`
	);
});

// Check database configuration
console.log('\n⚙️  Database configuration:');
try {
	const config = require('../config/database.js')[env];
	console.log(`   Environment: ${env}`);
	console.log(`   Host: ${config.host}`);
	console.log(`   Port: ${config.port}`);
	console.log(`   Database: ${config.database}`);
	console.log(`   User: ${config.username}`);
	console.log(`   Logging: ${config.logging ? 'enabled' : 'disabled'}`);
	console.log('✅ Database configuration loaded successfully');
} catch (error) {
	console.log(`❌ Error loading database configuration: ${error.message}`);
}

// Check database connection
console.log('\n🔌 Testing database connection:');
try {
	const sequelize = require('../db.js');
	sequelize
		.authenticate()
		.then(() => {
			console.log('✅ Database connection successful');
			return sequelize.close();
		})
		.catch((error) => {
			console.log(
				`❌ Error connecting to the database: ${error.message}`
			);
		});
} catch (error) {
	console.log(`❌ Error creating connection: ${error.message}`);
}

console.log('\n📝 Recommendations:');
if (!fs.existsSync(envPath)) {
	console.log('1. Create .env file based on env.example');
	console.log('2. Fill in the required environment variables');
}

const missingVars = [
	'DB_HOST',
	'DB_NAME',
	'DB_USER',
	'DB_PASSWORD',
	'JWT_ACCESS_SECRET',
	'JWT_REFRESH_SECRET',
	'BOT_TOKEN',
].filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
	console.log(`3. Set the missing variables: ${missingVars.join(', ')}`);
}

console.log('\n🎉 Check completed!');
