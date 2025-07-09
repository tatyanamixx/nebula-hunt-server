/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const client = require('prom-client');
const express = require('express');

// Стандартные метрики (включают eventLoopLag, heap, file descriptors, а также pool-метрики для популярных драйверов)
client.collectDefaultMetrics();

// Кастомные метрики
const userRegistrationCounter = new client.Counter({
	name: 'game_user_registrations_total',
	help: 'Total number of user registrations',
});

const purchaseCounter = new client.Counter({
	name: 'game_purchases_total',
	help: 'Total number of successful purchases',
	labelNames: ['currency'],
});

const revenueCounter = new client.Counter({
	name: 'game_revenue_total',
	help: 'Total revenue by currency',
	labelNames: ['currency'],
});

const errorCounter = new client.Counter({
	name: 'game_errors_total',
	help: 'Total number of errors',
	labelNames: ['type'], // type: 4xx, 5xx, etc.
});

const offerCounter = new client.Counter({
	name: 'game_market_offers_total',
	help: 'Total number of market offers created',
});

const dealCounter = new client.Counter({
	name: 'game_market_deals_total',
	help: 'Total number of market deals completed',
});

// HTTP-метрики
const httpRequestCounter = new client.Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status'],
});

const httpErrorCounter = new client.Counter({
	name: 'http_errors_total',
	help: 'Total number of HTTP error responses',
	labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new client.Histogram({
	name: 'http_request_duration_seconds',
	help: 'Duration of HTTP requests in seconds',
	labelNames: ['method', 'route', 'status'],
	buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

const httpResponseSize = new client.Histogram({
	name: 'http_response_size_bytes',
	help: 'Size of HTTP responses in bytes',
	labelNames: ['method', 'route', 'status'],
	buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
});

const activeUsersDAU = new client.Gauge({
	name: 'game_active_users_dau',
	help: 'Number of unique active users in the last 24h',
});

const activeUsersWAU = new client.Gauge({
	name: 'game_active_users_wau',
	help: 'Number of unique active users in the last 7 days',
});

const activeUsersMAU = new client.Gauge({
	name: 'game_active_users_mau',
	help: 'Number of unique active users in the last 30 days',
});

// Кастомная метрика: количество подключений к базе (если поддерживается)
const dbConnectionsGauge = new client.Gauge({
	name: 'db_connections',
	help: 'Number of active DB connections',
});

// Middleware для сбора HTTP-метрик
function prometheusHttpMiddleware(req, res, next) {
	const start = process.hrtime();
	const method = req.method;
	let route =
		req.route && req.route.path
			? req.route.path
			: req.originalUrl.split('?')[0];
	let responseSize = 0;
	const originalWrite = res.write;
	const originalEnd = res.end;
	res.write = function (chunk, ...args) {
		if (chunk) responseSize += Buffer.byteLength(chunk);
		return originalWrite.apply(res, [chunk, ...args]);
	};
	res.end = function (chunk, ...args) {
		if (chunk) responseSize += Buffer.byteLength(chunk);
		return originalEnd.apply(res, [chunk, ...args]);
	};
	res.on('finish', () => {
		const status = res.statusCode;
		if (req.route && req.route.path) route = req.baseUrl + req.route.path;
		httpRequestCounter.inc({ method, route, status });
		if (status >= 400) httpErrorCounter.inc({ method, route, status });
		const diff = process.hrtime(start);
		const duration = diff[0] + diff[1] / 1e9;
		httpRequestDuration.observe({ method, route, status }, duration);
		httpResponseSize.observe({ method, route, status }, responseSize);
	});
	next();
}

const router = express.Router();

router.get('/metrics', async (req, res) => {
	try {
		res.set('Content-Type', client.register.contentType);
		res.end(await client.register.metrics());
	} catch (e) {
		res.status(500).end(e.message);
	}
});

// Экспорт функции для обновления dbConnectionsGauge (вызывать из index.js или metrics-service.js)
async function updateDbConnections(sequelize) {
	if (
		sequelize &&
		sequelize.connectionManager &&
		sequelize.connectionManager.pool
	) {
		const pool = sequelize.connectionManager.pool;
		// Для sequelize-pool v6+
		if (typeof pool.size === 'function') {
			dbConnectionsGauge.set(pool.size);
		} else if (
			typeof pool.available === 'function' &&
			typeof pool.borrowed === 'function'
		) {
			dbConnectionsGauge.set(pool.available() + pool.borrowed());
		}
	}
}

module.exports = router;
module.exports.prometheusMetrics = {
	userRegistrationCounter,
	purchaseCounter,
	revenueCounter,
	errorCounter,
	offerCounter,
	dealCounter,
	httpRequestCounter,
	httpErrorCounter,
	httpRequestDuration,
	httpResponseSize,
	activeUsersDAU,
	activeUsersWAU,
	activeUsersMAU,
	dbConnectionsGauge,
	updateDbConnections,
	prometheusHttpMiddleware,
};
