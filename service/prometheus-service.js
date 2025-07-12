/**
 * Prometheus Service
 * Сервис для управления метриками Prometheus
 * created by Assistant on 15.07.2025
 */

const client = require('prom-client');
const { UserState } = require('../models/models');
const { Op } = require('sequelize');
const sequelize = require('../db');
const logger = require('./logger-service');

class PrometheusService {
	constructor() {
		// Инициализация стандартных метрик (только если еще не инициализированы)
		try {
			client.collectDefaultMetrics();
		} catch (error) {
			// Метрики уже инициализированы, игнорируем ошибку
			logger.debug('Default metrics already initialized');
		}

		// Инициализация кастомных метрик
		this.initializeMetrics();
	}

	/**
	 * Инициализация всех метрик
	 */
	initializeMetrics() {
		// Счетчики событий
		this.userRegistrationCounter = new client.Counter({
			name: 'game_user_registrations_total',
			help: 'Total number of user registrations',
		});

		this.purchaseCounter = new client.Counter({
			name: 'game_purchases_total',
			help: 'Total number of successful purchases',
			labelNames: ['currency'],
		});

		this.revenueCounter = new client.Counter({
			name: 'game_revenue_total',
			help: 'Total revenue by currency',
			labelNames: ['currency'],
		});

		this.errorCounter = new client.Counter({
			name: 'game_errors_total',
			help: 'Total number of errors',
			labelNames: ['type'], // type: 4xx, 5xx, etc.
		});

		this.offerCounter = new client.Counter({
			name: 'game_market_offers_total',
			help: 'Total number of market offers created',
			labelNames: ['type'], // type: galaxy, artifact, resource, package
		});

		this.dealCounter = new client.Counter({
			name: 'game_market_deals_total',
			help: 'Total number of market deals completed',
			labelNames: ['currency'],
		});

		// HTTP метрики
		this.httpRequestCounter = new client.Counter({
			name: 'http_requests_total',
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'route', 'status'],
		});

		this.httpErrorCounter = new client.Counter({
			name: 'http_errors_total',
			help: 'Total number of HTTP error responses',
			labelNames: ['method', 'route', 'status'],
		});

		this.httpRequestDuration = new client.Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status'],
			buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
		});

		this.httpResponseSize = new client.Histogram({
			name: 'http_response_size_bytes',
			help: 'Size of HTTP responses in bytes',
			labelNames: ['method', 'route', 'status'],
			buckets: [
				100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000,
			],
		});

		// Метрики активных пользователей
		this.activeUsersDAU = new client.Gauge({
			name: 'game_active_users_dau',
			help: 'Number of unique active users in the last 24h',
		});

		this.activeUsersWAU = new client.Gauge({
			name: 'game_active_users_wau',
			help: 'Number of unique active users in the last 7 days',
		});

		this.activeUsersMAU = new client.Gauge({
			name: 'game_active_users_mau',
			help: 'Number of unique active users in the last 30 days',
		});

		// Метрики базы данных
		this.dbConnectionsGauge = new client.Gauge({
			name: 'db_connections',
			help: 'Number of active DB connections',
		});

		// Метрики игровых ресурсов
		this.totalStardustGauge = new client.Gauge({
			name: 'game_total_stardust',
			help: 'Total stardust in the game economy',
		});

		this.totalDarkMatterGauge = new client.Gauge({
			name: 'game_total_dark_matter',
			help: 'Total dark matter in the game economy',
		});

		this.totalTgStarsGauge = new client.Gauge({
			name: 'game_total_tg_stars',
			help: 'Total TG Stars in the game economy',
		});

		// Метрики галактик
		this.totalGalaxiesGauge = new client.Gauge({
			name: 'game_total_galaxies',
			help: 'Total number of galaxies in the game',
		});

		this.ownedGalaxiesGauge = new client.Gauge({
			name: 'game_owned_galaxies',
			help: 'Total number of owned galaxies',
		});

		// Метрики артефактов
		this.totalArtifactsGauge = new client.Gauge({
			name: 'game_total_artifacts',
			help: 'Total number of artifacts in the game',
			labelNames: ['rarity'],
		});
	}

	/**
	 * Middleware для сбора HTTP метрик
	 */
	httpMiddleware(req, res, next) {
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

		const self = this;
		res.on('finish', () => {
			const status = res.statusCode;
			if (req.route && req.route.path) {
				route = req.baseUrl + req.route.path;
			}

			self.httpRequestCounter.inc({ method, route, status });

			if (status >= 400) {
				self.httpErrorCounter.inc({ method, route, status });
			}

			const diff = process.hrtime(start);
			const duration = diff[0] + diff[1] / 1e9;

			self.httpRequestDuration.observe(
				{ method, route, status },
				duration
			);
			self.httpResponseSize.observe(
				{ method, route, status },
				responseSize
			);
		});

		next();
	}

	/**
	 * Обновление метрик активных пользователей
	 */
	async updateActiveUsersMetrics() {
		try {
			const { UserState } = require('../models/models');

			const now = new Date();
			const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

			// Используем updatedAt как приближение для последней активности
			const [dau, wau, mau] = await Promise.all([
				UserState.count({
					where: { updatedAt: { [Op.gte]: since24h } },
				}),
				UserState.count({
					where: { updatedAt: { [Op.gte]: since7d } },
				}),
				UserState.count({
					where: { updatedAt: { [Op.gte]: since30d } },
				}),
			]);

			this.activeUsersDAU.set(dau);
			this.activeUsersWAU.set(wau);
			this.activeUsersMAU.set(mau);

			logger.debug(
				`Updated active users metrics: DAU=${dau}, WAU=${wau}, MAU=${mau}`
			);
		} catch (error) {
			logger.error(
				`Error updating active users metrics: ${error.message}`
			);
		}
	}

	/**
	 * Обновление метрик базы данных
	 */
	async updateDatabaseMetrics() {
		try {
			if (
				sequelize &&
				sequelize.connectionManager &&
				sequelize.connectionManager.pool
			) {
				const pool = sequelize.connectionManager.pool;

				if (typeof pool.size === 'function') {
					this.dbConnectionsGauge.set(pool.size());
				} else if (
					typeof pool.available === 'function' &&
					typeof pool.borrowed === 'function'
				) {
					this.dbConnectionsGauge.set(
						pool.available() + pool.borrowed()
					);
				}
			}
		} catch (error) {
			logger.error(`Error updating database metrics: ${error.message}`);
		}
	}

	/**
	 * Обновление метрик игровой экономики
	 */
	async updateEconomyMetrics() {
		try {
			const { UserState, Galaxy, Artifact } = require('../models/models');

			// Общие ресурсы в экономике
			const totalResources = await UserState.findAll({
				attributes: [
					[
						sequelize.fn('SUM', sequelize.col('stardust')),
						'totalStardust',
					],
					[
						sequelize.fn('SUM', sequelize.col('darkMatter')),
						'totalDarkMatter',
					],
					[
						sequelize.fn('SUM', sequelize.col('tgStars')),
						'totalTgStars',
					],
				],
				raw: true,
			});

			if (totalResources && totalResources.length > 0) {
				const data = totalResources[0];
				this.totalStardustGauge.set(
					parseFloat(data.totalStardust) || 0
				);
				this.totalDarkMatterGauge.set(
					parseFloat(data.totalDarkMatter) || 0
				);
				this.totalTgStarsGauge.set(parseFloat(data.totalTgStars) || 0);
			}

			// Метрики галактик - используем правильное поле userId
			const [totalGalaxies, ownedGalaxies] = await Promise.all([
				Galaxy.count(),
				Galaxy.count({ where: { userId: { [Op.ne]: null } } }),
			]);

			this.totalGalaxiesGauge.set(totalGalaxies);
			this.ownedGalaxiesGauge.set(ownedGalaxies);

			// Метрики артефактов по редкости
			const artifactsByRarity = await Artifact.findAll({
				attributes: [
					'rarity',
					[sequelize.fn('COUNT', sequelize.col('id')), 'count'],
				],
				group: ['rarity'],
				raw: true,
			});

			artifactsByRarity.forEach((artifact) => {
				this.totalArtifactsGauge.set(
					{ rarity: artifact.rarity },
					parseInt(artifact.count)
				);
			});

			logger.debug('Updated economy metrics');
		} catch (error) {
			logger.error(`Error updating economy metrics: ${error.message}`);
		}
	}

	/**
	 * Обновление всех метрик
	 */
	async updateAllMetrics() {
		try {
			await Promise.all([
				this.updateActiveUsersMetrics(),
				this.updateDatabaseMetrics(),
				this.updateEconomyMetrics(),
			]);

			logger.debug('All Prometheus metrics updated successfully');
		} catch (error) {
			logger.error(`Error updating all metrics: ${error.message}`);
		}
	}

	/**
	 * Получение метрик в формате Prometheus
	 */
	async getMetrics() {
		try {
			return await client.register.metrics();
		} catch (error) {
			logger.error(`Error getting metrics: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Инкремент счетчика регистраций
	 */
	incrementUserRegistration() {
		this.userRegistrationCounter.inc();
	}

	/**
	 * Инкремент счетчика покупок
	 */
	incrementPurchase(currency) {
		this.purchaseCounter.inc({ currency });
	}

	/**
	 * Инкремент счетчика доходов
	 */
	incrementRevenue(currency, amount) {
		this.revenueCounter.inc({ currency }, amount);
	}

	/**
	 * Инкремент счетчика ошибок
	 */
	incrementError(type) {
		this.errorCounter.inc({ type });
	}

	/**
	 * Инкремент счетчика оферт
	 */
	incrementOffer(type) {
		this.offerCounter.inc({ type });
	}

	/**
	 * Инкремент счетчика сделок
	 */
	incrementDeal(currency) {
		this.dealCounter.inc({ currency });
	}
}

module.exports = new PrometheusService();
