/**
 * Prometheus Router Tests
 * created by Assistant on 15.07.2025
 */

const request = require('supertest');
const express = require('express');
const prometheusRouter = require('../../routes/prometheus-router');

const app = express();
app.use('/metrics', prometheusRouter);

describe('Prometheus Router', () => {
	describe('GET /metrics', () => {
		test('should return metrics in Prometheus format', async () => {
			const response = await request(app)
				.get('/metrics/metrics')
				.expect(200);

			expect(response.headers['content-type']).toContain('text/plain');
			expect(response.text).toContain('# HELP');
			expect(response.text).toContain('# TYPE');
		});

		test('should handle metrics retrieval errors', async () => {
			// Мокаем ошибку в сервисе
			const originalGetMetrics =
				require('../../service/prometheus-service').getMetrics;
			require('../../service/prometheus-service').getMetrics = jest
				.fn()
				.mockRejectedValue(new Error('Test error'));

			const response = await request(app)
				.get('/metrics/metrics')
				.expect(500);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('METRICS_ERROR');

			// Восстанавливаем оригинальный метод
			require('../../service/prometheus-service').getMetrics =
				originalGetMetrics;
		});
	});

	describe('GET /health', () => {
		test('should return healthy status', async () => {
			const response = await request(app)
				.get('/metrics/health')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.status).toBe('healthy');
			expect(response.body.timestamp).toBeDefined();
		});

		test('should handle health check errors', async () => {
			// Мокаем ошибку в сервисе
			const originalGetMetrics =
				require('../../service/prometheus-service').getMetrics;
			require('../../service/prometheus-service').getMetrics = jest
				.fn()
				.mockRejectedValue(new Error('Test error'));

			const response = await request(app)
				.get('/metrics/health')
				.expect(503);

			expect(response.body.success).toBe(false);
			expect(response.body.status).toBe('unhealthy');
			expect(response.body.error).toBe('Test error');

			// Восстанавливаем оригинальный метод
			require('../../service/prometheus-service').getMetrics =
				originalGetMetrics;
		});
	});

	describe('POST /update', () => {
		test('should update metrics successfully', async () => {
			const response = await request(app)
				.post('/metrics/update')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Metrics updated successfully');
			expect(response.body.timestamp).toBeDefined();
		});

		test('should handle update errors', async () => {
			// Мокаем ошибку в сервисе
			const originalUpdateAllMetrics =
				require('../../service/prometheus-service').updateAllMetrics;
			require('../../service/prometheus-service').updateAllMetrics = jest
				.fn()
				.mockRejectedValue(new Error('Test error'));

			const response = await request(app)
				.post('/metrics/update')
				.expect(500);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('UPDATE_ERROR');

			// Восстанавливаем оригинальный метод
			require('../../service/prometheus-service').updateAllMetrics =
				originalUpdateAllMetrics;
		});
	});
});
