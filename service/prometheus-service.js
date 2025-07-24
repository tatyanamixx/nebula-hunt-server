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
		// Проверяем, не были ли метрики уже инициализированы
		if (this.metricsInitialized) {
			return;
		}

		try {
			// Устанавливаем флаг инициализации
			this.metricsInitialized = true;
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

			// Метрики для мониторинга запросов
			this.requestCounter = new client.Counter({
				name: 'game_requests_total',
				help: 'Total number of requests',
				labelNames: ['method', 'route', 'status'],
			});

			// Метрики для инкремента новой регистрации пользователя (удалена дублирующаяся метрика)

			// Метрики активных пользователей
			this.activeUsersTotal = new client.Gauge({
				name: 'game_active_users_total',
				help: 'Total number of active users',
			});

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
				name: 'game_db_connections',
				help: 'Number of active database connections',
			});

			// Метрики экономики
			this.totalStardustGauge = new client.Gauge({
				name: 'game_total_stardust',
				help: 'Total stardust in the economy',
			});

			this.totalDarkMatterGauge = new client.Gauge({
				name: 'game_total_dark_matter',
				help: 'Total dark matter in the economy',
			});

			this.totalTgStarsGauge = new client.Gauge({
				name: 'game_total_tg_stars',
				help: 'Total TG stars in the economy',
			});

			this.totalStarsGauge = new client.Gauge({
				name: 'game_total_stars',
				help: 'Total stars in the economy',
			});

			this.totalTonTokenGauge = new client.Gauge({
				name: 'game_total_ton_token',
				help: 'Total TON tokens in the economy',
			});

			// Метрики галактик
			this.totalGalaxiesGauge = new client.Gauge({
				name: 'game_total_galaxies',
				help: 'Total number of galaxies',
			});

			this.ownedGalaxiesGauge = new client.Gauge({
				name: 'game_owned_galaxies',
				help: 'Number of owned galaxies',
			});

			// Метрики артефактов
			this.totalArtifactsGauge = new client.Gauge({
				name: 'game_total_artifacts',
				help: 'Total number of artifacts',
				labelNames: ['rarity'],
			});

			this.metricsInitialized = true;
			logger.debug('Prometheus metrics initialized successfully');
		} catch (error) {
			// Если метрики уже зарегистрированы, просто получаем их из registry
			if (error.message.includes('already been registered')) {
				logger.debug(
					'Metrics already registered, getting from registry'
				);
				this.getMetricsFromRegistry();
			} else {
				logger.error(`Error initializing metrics: ${error.message}`);
				throw error;
			}
		}
	}

	/**
	 * Получение метрик из registry (если они уже зарегистрированы)
	 */
	getMetricsFromRegistry() {
		try {
			const registry = client.register;
			const metrics = registry.getMetricsAsArray();

			// Находим существующие метрики и присваиваем их свойствам класса
			metrics.forEach((metric) => {
				switch (metric.name) {
					case 'game_user_registrations_total':
						this.userRegistrationCounter = metric;
						break;
					case 'game_purchases_total':
						this.purchaseCounter = metric;
						break;
					case 'game_revenue_total':
						this.revenueCounter = metric;
						break;
					case 'game_errors_total':
						this.errorCounter = metric;
						break;
					case 'game_market_offers_total':
						this.offerCounter = metric;
						break;
					case 'game_market_deals_total':
						this.dealCounter = metric;
						break;
					case 'http_requests_total':
						this.httpRequestCounter = metric;
						break;
					case 'http_errors_total':
						this.httpErrorCounter = metric;
						break;
					case 'http_request_duration_seconds':
						this.httpRequestDuration = metric;
						break;
					case 'http_response_size_bytes':
						this.httpResponseSize = metric;
						break;
					case 'game_requests_total':
						this.requestCounter = metric;
						break;
					case 'game_increment_user_registrations_total':
						this.incrementUserRegistration = metric;
						break;
					case 'game_active_users_total':
						this.activeUsersTotal = metric;
						break;
					case 'game_active_users_dau':
						this.activeUsersDAU = metric;
						break;
					case 'game_active_users_wau':
						this.activeUsersWAU = metric;
						break;
					case 'game_active_users_mau':
						this.activeUsersMAU = metric;
						break;
					case 'game_db_connections':
						this.dbConnectionsGauge = metric;
						break;
					case 'game_total_stardust':
						this.totalStardustGauge = metric;
						break;
					case 'game_total_dark_matter':
						this.totalDarkMatterGauge = metric;
						break;
					case 'game_total_tg_stars':
						this.totalTgStarsGauge = metric;
						break;
					case 'game_total_stars':
						this.totalStarsGauge = metric;
						break;
					case 'game_total_ton_token':
						this.totalTonTokenGauge = metric;
						break;
					case 'game_total_galaxies':
						this.totalGalaxiesGauge = metric;
						break;
					case 'game_owned_galaxies':
						this.ownedGalaxiesGauge = metric;
						break;
					case 'game_total_artifacts':
						this.totalArtifactsGauge = metric;
						break;
				}
			});

			this.metricsInitialized = true;
			logger.debug('Metrics retrieved from registry successfully');
		} catch (error) {
			logger.error(
				`Error getting metrics from registry: ${error.message}`
			);
			throw error;
		}
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
		const prometheusService = this; // Сохраняем ссылку на this

		res.write = function (chunk, ...args) {
			if (chunk) responseSize += Buffer.byteLength(chunk);
			return originalWrite.apply(this, [chunk, ...args]);
		};

		res.end = function (chunk, ...args) {
			if (chunk) responseSize += Buffer.byteLength(chunk);
			const duration = process.hrtime(start);
			const durationSeconds = duration[0] + duration[1] / 1e9;

			const status = res.statusCode.toString();
			const statusClass = status.charAt(0) + 'xx';

			try {
				// Инкремент счетчиков
				if (prometheusService.httpRequestCounter) {
					prometheusService.httpRequestCounter.inc({
						method,
						route,
						status,
					});
				}
				if (prometheusService.requestCounter) {
					prometheusService.requestCounter.inc({
						method,
						route,
						status,
					});
				}

				if (statusClass === '4xx' || statusClass === '5xx') {
					if (prometheusService.httpErrorCounter) {
						prometheusService.httpErrorCounter.inc({
							method,
							route,
							status,
						});
					}
					if (prometheusService.errorCounter) {
						prometheusService.errorCounter.inc({
							type: statusClass,
						});
					}
				}

				// Обновление гистограмм
				if (prometheusService.httpRequestDuration) {
					prometheusService.httpRequestDuration.observe(
						{ method, route, status },
						durationSeconds
					);
				}
				if (prometheusService.httpResponseSize) {
					prometheusService.httpResponseSize.observe(
						{ method, route, status },
						responseSize
					);
				}
			} catch (error) {
				// Логируем ошибку, но не прерываем ответ
				logger.warn('Failed to update HTTP metrics:', error.message);
			}

			return originalEnd.apply(this, [chunk, ...args]);
		};

		next();
	}

	/**
	 * Обновление метрик активных пользователей
	 */
	async updateActiveUsersMetrics() {
		try {
			const now = new Date();
			const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			const oneWeekAgo = new Date(
				now.getTime() - 7 * 24 * 60 * 60 * 1000
			);
			const oneMonthAgo = new Date(
				now.getTime() - 30 * 24 * 60 * 60 * 1000
			);

			// Общее количество пользователей
			const totalUsers = await UserState.count();
			this.activeUsersTotal.set(totalUsers);

			// DAU (Daily Active Users)
			const dau = await UserState.count({
				where: {
					updatedAt: {
						[Op.gte]: oneDayAgo,
					},
				},
			});
			this.activeUsersDAU.set(dau);

			// WAU (Weekly Active Users)
			const wau = await UserState.count({
				where: {
					updatedAt: {
						[Op.gte]: oneWeekAgo,
					},
				},
			});
			this.activeUsersWAU.set(wau);

			// MAU (Monthly Active Users)
			const mau = await UserState.count({
				where: {
					updatedAt: {
						[Op.gte]: oneMonthAgo,
					},
				},
			});
			this.activeUsersMAU.set(mau);

			logger.debug('Updated active users metrics');
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
			// Получение информации о подключениях к БД
			const pool = sequelize.connectionManager.pool;
			if (pool) {
				this.dbConnectionsGauge.set(pool.size);
			}

			logger.debug('Updated database metrics');
		} catch (error) {
			logger.error(`Error updating database metrics: ${error.message}`);
		}
	}

	/**
	 * Обновление экономических метрик
	 */
	async updateEconomyMetrics() {
		try {
			const {
				UserState,
				Galaxy,
				Artifact,
				ArtifactTemplate,
			} = require('../models/models');

			// Общие ресурсы в экономике
			const economyData = await UserState.findAll({
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
					[sequelize.fn('SUM', sequelize.col('stars')), 'totalStars'],
					[
						sequelize.fn('SUM', sequelize.col('tonToken')),
						'totalTonToken',
					],
				],
				raw: true,
			});

			if (economyData.length > 0) {
				const data = economyData[0];
				this.totalStardustGauge.set(
					parseFloat(data.totalStardust) || 0
				);
				this.totalDarkMatterGauge.set(
					parseFloat(data.totalDarkMatter) || 0
				);
				this.totalTgStarsGauge.set(parseFloat(data.totalTgStars) || 0);
				this.totalStarsGauge.set(parseFloat(data.totalStars) || 0);
				this.totalTonTokenGauge.set(
					parseFloat(data.totalTonToken) || 0
				);
			}

			// Метрики галактик
			const totalGalaxies = await Galaxy.count();
			const ownedGalaxies = await Galaxy.count({
				where: {
					userId: { [Op.ne]: null },
				},
			});

			this.totalGalaxiesGauge.set(totalGalaxies);
			this.ownedGalaxiesGauge.set(ownedGalaxies);

			// Метрики артефактов по редкости
			try {
				const artifactsByRarity = await Artifact.findAll({
					include: [
						{
							model: ArtifactTemplate,
							attributes: ['rarity'],
							required: true,
						},
					],
					attributes: [
						[
							sequelize.fn('COUNT', sequelize.col('Artifact.id')),
							'count',
						],
						[sequelize.col('ArtifactTemplate.rarity'), 'rarity'],
					],
					group: ['ArtifactTemplate.rarity'],
					raw: true,
				});

				artifactsByRarity.forEach((artifact) => {
					if (artifact.rarity && artifact.count) {
						this.totalArtifactsGauge.set(
							{ rarity: artifact.rarity },
							parseInt(artifact.count)
						);
					}
				});
			} catch (artifactError) {
				logger.warn(
					'Failed to update artifact metrics:',
					artifactError.message
				);
			}

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
