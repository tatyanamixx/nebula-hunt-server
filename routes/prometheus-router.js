/**
 * Prometheus Router
 * Роутер для предоставления метрик Prometheus
 * created by Assistant on 15.07.2025
 */

const express = require('express');
const prometheusService = require('../service/prometheus-service');
const logger = require('../service/logger-service');

const router = express.Router();

/**
 * GET /
 * Предоставляет метрики в формате Prometheus
 */
router.get('/', async (req, res) => {
	try {
		// Обновляем метрики перед отправкой
		await prometheusService.updateAllMetrics();

		// Получаем метрики в формате Prometheus
		const metrics = await prometheusService.getMetrics();

		res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
		res.end(metrics);

		logger.debug('Prometheus metrics endpoint accessed');
	} catch (error) {
		logger.error(`Error serving Prometheus metrics: ${error.message}`);
		res.status(500).json({
			success: false,
			error: {
				code: 'METRICS_ERROR',
				message: 'Failed to retrieve metrics',
			},
		});
	}
});

/**
 * GET /metrics/health
 * Проверка здоровья сервиса метрик
 */
router.get('/health', async (req, res) => {
	try {
		// Проверяем доступность метрик
		await prometheusService.getMetrics();

		res.json({
			success: true,
			status: 'healthy',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error(`Prometheus health check failed: ${error.message}`);
		res.status(503).json({
			success: false,
			status: 'unhealthy',
			error: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

/**
 * POST /metrics/update
 * Принудительное обновление всех метрик (только для администраторов)
 */
router.post('/update', async (req, res) => {
	try {
		await prometheusService.updateAllMetrics();

		res.json({
			success: true,
			message: 'Metrics updated successfully',
			timestamp: new Date().toISOString(),
		});

		logger.info('Prometheus metrics manually updated');
	} catch (error) {
		logger.error(`Error updating Prometheus metrics: ${error.message}`);
		res.status(500).json({
			success: false,
			error: {
				code: 'UPDATE_ERROR',
				message: 'Failed to update metrics',
			},
		});
	}
});

module.exports = router;
