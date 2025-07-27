/**
 * Test script to verify QR code fix (no duplicate Nebulahunt)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com'; // Replace with existing admin email

async function testQRCodeFix() {
	try {
		console.log('🧪 Testing QR code fix (no duplicate Nebulahunt)...\n');

		// Test 1: Get 2FA QR code for login
		console.log('📱 Test 1: Getting 2FA QR code for login...');
		const qrResponse = await axios.get(
			`${BASE_URL}/api/admin/2fa/qr/${TEST_EMAIL}`
		);

		console.log('✅ QR code data:');
		console.log('- Email:', qrResponse.data.email);
		console.log('- Secret:', qrResponse.data.google2faSecret);
		console.log('- OTP Auth URL:', qrResponse.data.otpAuthUrl);

		// Check if URL contains duplicate Nebulahunt
		const otpAuthUrl = qrResponse.data.otpAuthUrl;
		const nebulaCount = (otpAuthUrl.match(/Nebulahunt/g) || []).length;

		console.log('\n🔍 Analysis:');
		console.log('- Total "Nebulahunt" occurrences:', nebulaCount);

		if (nebulaCount === 1) {
			console.log('✅ SUCCESS: No duplicate Nebulahunt found!');
			console.log('✅ QR code format is correct');
		} else if (nebulaCount === 0) {
			console.log('⚠️  WARNING: No "Nebulahunt" found in URL');
		} else {
			console.log('❌ ERROR: Duplicate "Nebulahunt" found!');
			console.log('❌ QR code still has the old format');
		}

		// Parse the URL to show structure
		console.log('\n📋 URL Structure:');
		try {
			const url = new URL(otpAuthUrl);
			console.log('- Protocol:', url.protocol);
			console.log('- Host:', url.host);
			console.log('- Pathname:', url.pathname);
			console.log('- Search params:', url.search);

			// Parse the pathname to show account name
			const pathParts = url.pathname.split('/');
			const accountName = decodeURIComponent(
				pathParts[pathParts.length - 1]
			);
			console.log('- Account name:', accountName);

			// Parse search params
			const params = new URLSearchParams(url.search);
			console.log('- Secret:', params.get('secret'));
			console.log('- Issuer:', params.get('issuer'));
		} catch (error) {
			console.log('❌ Error parsing URL:', error.message);
		}
	} catch (error) {
		console.error('❌ Error:', error.response?.data || error.message);

		if (error.response?.status === 404) {
			console.log('\n💡 Admin not found. Try with a different email:');
			console.log('1. Check existing admins in database');
			console.log('2. Update TEST_EMAIL in this script');
		}
	}
}

// Run the test
testQRCodeFix();
