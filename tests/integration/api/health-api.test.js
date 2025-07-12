const request = require('supertest');
const { app } = require('../../../index');

describe('Health API Integration Tests', () => {
	describe('GET /health', () => {
		test('should return health status', async () => {
			const response = await request(app).get('/health').expect(200);

			expect(response.text).toBe('OK');
		});
	});

	describe('GET /api-docs', () => {
		test('should return swagger documentation', async () => {
			const response = await request(app).get('/api-docs').expect(200);

			expect(response.text).toContain('swagger');
		});
	});

	describe('GET /metrics', () => {
		test('should return prometheus metrics', async () => {
			const response = await request(app).get('/metrics').expect(200);

			expect(response.text).toContain('nodejs');
		});
	});
});
