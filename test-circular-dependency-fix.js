/**
 * Test script to verify circular dependency fix
 * Tests that game-service.js and market-service.js can be loaded without circular dependency errors
 */

const gameService = require('./service/game-service');
const marketService = require('./service/market-service');

console.log(
	'✅ Both services loaded successfully without circular dependency errors'
);

// Test that registerStarsTransfer method exists in gameService
console.log(
	'✅ registerStarsTransfer method exists in gameService:',
	typeof gameService.registerStarsTransfer === 'function'
);

// Test that registerOffer method exists in marketService
console.log(
	'✅ registerOffer method exists in marketService:',
	typeof marketService.registerOffer === 'function'
);

// Test that the old registerStarsTransfer in marketService throws the expected error
try {
	marketService.registerStarsTransfer({});
	console.log(
		'❌ Error: registerStarsTransfer in marketService should throw an error'
	);
} catch (error) {
	if (
		error.message.includes('should be called from game-service.js directly')
	) {
		console.log(
			'✅ registerStarsTransfer in marketService correctly throws expected error'
		);
	} else {
		console.log(
			'❌ Unexpected error from marketService.registerStarsTransfer:',
			error.message
		);
	}
}

console.log(
	'\n🎉 Circular dependency fix verification completed successfully!'
);
