/**
 * Prometheus Service Tests
 * created by Assistant on 15.07.2025
 */

const prometheusService = require('../../service/prometheus-service');

describe('PrometheusService', () => {
	describe('Metrics Initialization', () => {
		test('should initialize all metrics', () => {
			expect(prometheusService.userRegistrationCounter).toBeDefined();
			expect(prometheusService.purchaseCounter).toBeDefined();
			expect(prometheusService.revenueCounter).toBeDefined();
			expect(prometheusService.errorCounter).toBeDefined();
			expect(prometheusService.offerCounter).toBeDefined();
			expect(prometheusService.dealCounter).toBeDefined();
			expect(prometheusService.httpRequestCounter).toBeDefined();
			expect(prometheusService.httpErrorCounter).toBeDefined();
			expect(prometheusService.httpRequestDuration).toBeDefined();
			expect(prometheusService.httpResponseSize).toBeDefined();
			expect(prometheusService.activeUsersDAU).toBeDefined();
			expect(prometheusService.activeUsersWAU).toBeDefined();
			expect(prometheusService.activeUsersMAU).toBeDefined();
			expect(prometheusService.dbConnectionsGauge).toBeDefined();
			expect(prometheusService.totalStardustGauge).toBeDefined();
			expect(prometheusService.totalDarkMatterGauge).toBeDefined();
			expect(prometheusService.totalTgStarsGauge).toBeDefined();
			expect(prometheusService.totalGalaxiesGauge).toBeDefined();
			expect(prometheusService.ownedGalaxiesGauge).toBeDefined();
			expect(prometheusService.totalArtifactsGauge).toBeDefined();
		});
	});

	describe('Counter Methods', () => {
		test('should increment user registration counter', () => {
			const initialValue =
				prometheusService.userRegistrationCounter.get();
			prometheusService.incrementUserRegistration();
			const finalValue = prometheusService.userRegistrationCounter.get();
			expect(finalValue.values[0].value).toBeGreaterThan(
				initialValue.values[0].value
			);
		});

		test('should increment purchase counter with currency label', () => {
			const initialValue = prometheusService.purchaseCounter.get();
			prometheusService.incrementPurchase('tonToken');
			const finalValue = prometheusService.purchaseCounter.get();
			expect(finalValue.values[0].value).toBeGreaterThan(
				initialValue.values[0].value
			);
		});

		test('should increment revenue counter with currency and amount', () => {
			const initialValue = prometheusService.revenueCounter.get();
			prometheusService.incrementRevenue('tonToken', 100);
			const finalValue = prometheusService.revenueCounter.get();
			expect(finalValue.values[0].value).toBeGreaterThan(
				initialValue.values[0].value
			);
		});

		test('should increment error counter with type label', () => {
			const initialValue = prometheusService.errorCounter.get();
			prometheusService.incrementError('4xx');
			const finalValue = prometheusService.errorCounter.get();
			expect(finalValue.values[0].value).toBeGreaterThan(
				initialValue.values[0].value
			);
		});

		test('should increment offer counter with type label', () => {
			const initialValue = prometheusService.offerCounter.get();
			prometheusService.incrementOffer('galaxy');
			const finalValue = prometheusService.offerCounter.get();
			expect(finalValue.values[0].value).toBeGreaterThan(
				initialValue.values[0].value
			);
		});

		test('should increment deal counter with currency label', () => {
			const initialValue = prometheusService.dealCounter.get();
			prometheusService.incrementDeal('tonToken');
			const finalValue = prometheusService.dealCounter.get();
			expect(finalValue.values[0].value).toBeGreaterThan(
				initialValue.values[0].value
			);
		});
	});

	describe('HTTP Middleware', () => {
		test('should have httpMiddleware method', () => {
			expect(typeof prometheusService.httpMiddleware).toBe('function');
		});
	});

	describe('Metrics Update Methods', () => {
		test('should have updateActiveUsersMetrics method', () => {
			expect(typeof prometheusService.updateActiveUsersMetrics).toBe(
				'function'
			);
		});

		test('should have updateDatabaseMetrics method', () => {
			expect(typeof prometheusService.updateDatabaseMetrics).toBe(
				'function'
			);
		});

		test('should have updateEconomyMetrics method', () => {
			expect(typeof prometheusService.updateEconomyMetrics).toBe(
				'function'
			);
		});

		test('should have updateAllMetrics method', () => {
			expect(typeof prometheusService.updateAllMetrics).toBe('function');
		});
	});

	describe('Get Metrics', () => {
		test('should have getMetrics method', () => {
			expect(typeof prometheusService.getMetrics).toBe('function');
		});

		test('should return metrics in Prometheus format', async () => {
			const metrics = await prometheusService.getMetrics();
			expect(typeof metrics).toBe('string');
			expect(metrics).toContain('# HELP');
			expect(metrics).toContain('# TYPE');
		});
	});
});
