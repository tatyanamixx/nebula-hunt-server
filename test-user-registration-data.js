const axios = require('axios');

// Конфигурация
const BASE_URL = 'http://localhost:5000';

// Функция для показа структуры данных registration endpoint
async function showRegistrationDataStructure() {
	try {
		console.log('🔍 Registration Endpoint Data Structure Analysis...\n');

		// Показываем ожидаемую структуру данных на основе кода
		console.log('📋 Expected Response Structure (based on code analysis):');
		console.log('   Status: 200 (if successful)');
		console.log('   Response Body Structure:');
		console.log('   {');
		console.log('     "accessToken": "jwt_token_string",');
		console.log('     "refreshToken": "jwt_refresh_token_string",');
		console.log('     "user": {');
		console.log('       "id": "bigint_user_id",');
		console.log('       "username": "string",');
		console.log('       "referral": "bigint_or_number",');
		console.log('       "role": "USER",');
		console.log('       "blocked": false,');
		console.log('       "createdAt": "date",');
		console.log('       "updatedAt": "date"');
		console.log('     },');
		console.log('     "userState": {');
		console.log('       "userId": "bigint",');
		console.log('       "level": number,');
		console.log('       "experience": number,');
		console.log('       "coins": number,');
		console.log('       "gems": number,');
		console.log('       "energy": number,');
		console.log('       "maxEnergy": number,');
		console.log('       "createdAt": "date",');
		console.log('       "updatedAt": "date"');
		console.log('     },');
		console.log('     "galaxy": {');
		console.log('       "id": "bigint",');
		console.log('       "userId": "bigint",');
		console.log('       "name": "string",');
		console.log('       "description": "string",');
		console.log('       "createdAt": "date",');
		console.log('       "updatedAt": "date"');
		console.log('     } (optional - only if galaxy data provided)');
		console.log('   }');

		// Показываем структуру ошибки
		console.log('\n📋 Error Response Structure:');
		console.log('   Status: 401 (Unauthorized)');
		console.log('   Response Body:');
		console.log('   {');
		console.log('     "message": "error_message_string",');
		console.log('     "errors": []');
		console.log('   }');

		// Показываем примеры запросов
		console.log('\n📤 Request Examples:');
		
		console.log('\n1. Registration with full data:');
		console.log('   POST /api/auth/registration');
		console.log('   Headers: {');
		console.log('     "Content-Type": "application/json",');
		console.log('     "X-Telegram-Init-Data": "valid_telegram_init_data"');
		console.log('   }');
		console.log('   Body: {');
		console.log('     "referral": "123456",');
		console.log('     "galaxy": {');
		console.log('       "name": "Test Galaxy",');
		console.log('       "description": "A test galaxy"');
		console.log('     }');
		console.log('   }');

		console.log('\n2. Registration with minimal data:');
		console.log('   POST /api/auth/registration');
		console.log('   Headers: {');
		console.log('     "Content-Type": "application/json",');
		console.log('     "X-Telegram-Init-Data": "valid_telegram_init_data"');
		console.log('   }');
		console.log('   Body: {}');

		console.log('\n3. Registration with referral only:');
		console.log('   POST /api/auth/registration');
		console.log('   Headers: {');
		console.log('     "Content-Type": "application/json",');
		console.log('     "X-Telegram-Init-Data": "valid_telegram_init_data"');
		console.log('   }');
		console.log('   Body: {');
		console.log('     "referral": "999999"');
		console.log('   }');

		// Показываем DTO структуры
		console.log('\n📋 DTO Structures (from code):');
		
		console.log('\nUserDto (from dtos/user-dto.js):');
		console.log('   - id: BigInt');
		console.log('   - username: String');
		console.log('   - referral: BigInt/Number');
		console.log('   - role: String');
		console.log('   - blocked: Boolean');
		console.log('   - createdAt: Date');
		console.log('   - updatedAt: Date');

		console.log('\nUserStateDto (from dtos/user-state-dto.js):');
		console.log('   - userId: BigInt');
		console.log('   - level: Number');
		console.log('   - experience: Number');
		console.log('   - coins: Number');
		console.log('   - gems: Number');
		console.log('   - energy: Number');
		console.log('   - maxEnergy: Number');
		console.log('   - createdAt: Date');
		console.log('   - updatedAt: Date');

		// Показываем процесс регистрации
		console.log('\n🔄 Registration Process (from service code):');
		console.log('   1. Create user (if not exists)');
		console.log('   2. Initialize user state');
		console.log('   3. Generate JWT tokens');
		console.log('   4. Create galaxy (if provided)');
		console.log('   5. Initialize upgrade tree');
		console.log('   6. Initialize user events');
		console.log('   7. Initialize user tasks');
		console.log('   8. Initialize package store');
		console.log('   9. Update Prometheus metrics');
		console.log('   10. Return response with tokens, user, userState, galaxy');

		// Показываем возможные ошибки
		console.log('\n❌ Possible Error Responses:');
		console.log('   401 - "Telegram auth: initData not found in headers"');
		console.log('   401 - "Telegram auth: invalid signature"');
		console.log('   400 - "Referral must be a number, bigint, or numeric string"');
		console.log('   400 - "User already exists"');
		console.log('   500 - Database errors');

		return true;

	} catch (error) {
		console.error('❌ Error analyzing data structure:', error.message);
		return false;
	}
}

// Функция для показа структуры других endpoints
async function showOtherEndpointsStructure() {
	try {
		console.log('\n' + '='.repeat(80));
		console.log('🔍 Other Auth Endpoints Data Structure...\n');

		console.log('📋 Login Endpoint (/api/auth/login):');
		console.log('   Method: POST');
		console.log('   Headers: X-Telegram-Init-Data required');
		console.log('   Body: {} (empty)');
		console.log('   Response: Same as registration (tokens + user + userState)');

		console.log('\n📋 Logout Endpoint (/api/auth/logout):');
		console.log('   Method: POST');
		console.log('   Headers: X-Telegram-Init-Data required');
		console.log('   Body: {} (empty)');
		console.log('   Response: { "message": "Logged out successfully" }');

		console.log('\n📋 Refresh Endpoint (/api/auth/refresh):');
		console.log('   Method: GET');
		console.log('   Headers: refreshToken in cookies');
		console.log('   Response: { "accessToken": "new_jwt_token" }');

		return true;

	} catch (error) {
		console.error('❌ Error analyzing other endpoints:', error.message);
		return false;
	}
}

// Основная функция
async function main() {
	console.log('🚀 Registration Endpoint Data Structure Analysis...\n');

	// Проверяем, что сервер запущен
	try {
		await axios.get(`${BASE_URL}/health`);
		console.log('✅ Server is running');
	} catch (error) {
		console.error('❌ Server is not running. Please start the server first.');
		console.error('   Run: npm start');
		process.exit(1);
	}

	// Запускаем анализ
	const registrationResult = await showRegistrationDataStructure();
	const otherEndpointsResult = await showOtherEndpointsStructure();

	console.log('\n' + '='.repeat(80));
	console.log('📊 Analysis Results:');
	console.log('   Registration structure analysis:', registrationResult ? '✅ COMPLETED' : '❌ FAILED');
	console.log('   Other endpoints analysis:', otherEndpointsResult ? '✅ COMPLETED' : '❌ FAILED');

	if (registrationResult && otherEndpointsResult) {
		console.log('\n🎉 All structure analysis completed!');
		console.log('\n💡 Summary:');
		console.log('   - Registration endpoint returns tokens + user + userState + galaxy');
		console.log('   - All endpoints require valid Telegram WebApp initData');
		console.log('   - Error responses follow standard ApiError format');
		console.log('   - Response includes JWT tokens for authentication');
	} else {
		console.log('\n⚠️  Some analysis failed. Check the output above for details.');
		process.exit(1);
	}
}

// Запускаем анализ
if (require.main === module) {
	main().catch(console.error);
}

module.exports = {
	showRegistrationDataStructure,
	showOtherEndpointsStructure,
}; 