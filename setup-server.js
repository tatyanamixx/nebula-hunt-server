#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Server setup for Nebulahunt...\n');

// Check for Node.js and npm
try {
	const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
	const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
	console.log(`✅ Node.js ${nodeVersion}, npm ${npmVersion}`);
} catch (error) {
	console.error('❌ Node.js or npm not installed');
	process.exit(1);
}

// Check for PostgreSQL
try {
	execSync('psql --version', { encoding: 'utf8' });
	console.log('✅ PostgreSQL found');
} catch (error) {
	console.log(
		'⚠️  PostgreSQL not found. Install PostgreSQL to work with the database'
	);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
	if (fs.existsSync(envExamplePath)) {
		fs.copyFileSync(envExamplePath, envPath);
		console.log('✅ Created .env file based on env.example');
	} else {
		console.log('⚠️  env.example file not found');
	}
} else {
	console.log('✅ .env file already exists');
}

// Create .env.local file if it doesn't exist
const envLocalPath = path.join(__dirname, '.env.local');
const envLocalExamplePath = path.join(__dirname, 'env.local.example');

if (!fs.existsSync(envLocalPath)) {
	if (fs.existsSync(envLocalExamplePath)) {
		fs.copyFileSync(envLocalExamplePath, envLocalPath);
		console.log('✅ Created .env.local file based on env.local.example');
	} else {
		console.log('⚠️  env.local.example file not found');
	}
} else {
	console.log('✅ .env.local file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
	execSync('npm install', { stdio: 'inherit' });
	console.log('✅ Dependencies installed');
} catch (error) {
	console.error('❌ Error installing dependencies');
	process.exit(1);
}

// Create logs folder
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir);
	console.log('✅ Created logs folder');
}

// Check environment variables
console.log('\n🔍 Checking environment variables...');
try {
	execSync('npm run env:check', { stdio: 'inherit' });
} catch (error) {
	console.log('⚠️  Error checking environment variables');
}

// Check database connection
console.log('\n🗄️  Checking database connection...');
try {
	execSync('node test-db-connection.js', { stdio: 'inherit' });
	console.log('✅ Database connection successful');
} catch (error) {
	console.log(
		'⚠️  Error connecting to the database. Check the settings in .env'
	);
}

// Run migrations
console.log('\n🔄 Running migrations...');
try {
	execSync('npm run migrate', { stdio: 'inherit' });
	console.log('✅ Migrations completed');
} catch (error) {
	console.log('⚠️  Error running migrations');
}

// Fill with test data
console.log('\n🌱 Filling with test data...');
try {
	execSync('npm run seed', { stdio: 'inherit' });
	console.log('✅ Test data added');
} catch (error) {
	console.log('⚠️  Error adding test data');
}

console.log('\n🎉 Server setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Edit the .env file with your settings');
console.log('2. Configure the Telegram bot and add the token to .env');
console.log('3. Start the server: npm run dev');
console.log('4. Open http://localhost:3001/health for testing');
console.log('5. API documentation: http://localhost:3001/api-docs');

console.log('\n🔧 Useful commands:');
console.log('- npm run dev          # Run in development mode');
console.log('- npm start            # Run in production');
console.log('- npm test             # Run tests');
console.log('- npm run migrate      # Run migrations');
console.log('- npm run seed         # Fill with test data');
