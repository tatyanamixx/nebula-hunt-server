const axios = require('axios');

describe('TON API Integration Tests', () => {
	const TON_TESTNET_API = 'https://testnet.toncenter.com/api/v2';
	const TEST_WALLET_ADDRESS =
		'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

	describe('Wallet Balance', () => {
		test('should fetch wallet balance from TON testnet', async () => {
			const response = await axios.get(
				`${TON_TESTNET_API}/getAddressBalance`,
				{
					params: {
						address: TEST_WALLET_ADDRESS,
					},
				}
			);

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty('ok');
			expect(response.data.ok).toBe(true);
			expect(response.data).toHaveProperty('result');
			expect(typeof response.data.result).toBe('string');
		}, 10000); // Увеличиваем таймаут для внешнего API

		test('should handle invalid wallet address', async () => {
			const invalidAddress = 'INVALID_ADDRESS';

			try {
				await axios.get(`${TON_TESTNET_API}/getAddressBalance`, {
					params: {
						address: invalidAddress,
					},
				});
			} catch (error) {
				// TON API может возвращать разные коды ошибок
				expect([400, 416, 429]).toContain(error.response.status);
				expect(error.response.data).toHaveProperty('error');
			}
		});
	});

	describe('Transaction History', () => {
		test('should fetch transaction history', async () => {
			try {
				const response = await axios.get(
					`${TON_TESTNET_API}/getTransactions`,
					{
						params: {
							address: TEST_WALLET_ADDRESS,
							limit: 10,
						},
					}
				);

				expect(response.status).toBe(200);
				expect(response.data).toHaveProperty('ok');
				expect(response.data.ok).toBe(true);
				expect(response.data).toHaveProperty('result');
				expect(Array.isArray(response.data.result)).toBe(true);
			} catch (error) {
				// Обрабатываем rate limiting
				if (error.response.status === 429) {
					console.log('Rate limited by TON API, skipping test');
					return;
				}
				throw error;
			}
		}, 15000);
	});

	describe('Network Status', () => {
		test('should get TON network status', async () => {
			try {
				const response = await axios.get(
					`${TON_TESTNET_API}/getMasterchainInfo`
				);

				expect(response.status).toBe(200);
				expect(response.data).toHaveProperty('ok');
				expect(response.data.ok).toBe(true);
				expect(response.data).toHaveProperty('result');
				expect(response.data.result).toHaveProperty('last');
			} catch (error) {
				// Обрабатываем rate limiting
				if (error.response.status === 429) {
					console.log('Rate limited by TON API, skipping test');
					return;
				}
				throw error;
			}
		}, 10000);
	});
});
