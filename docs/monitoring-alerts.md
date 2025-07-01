# 📊 Мониторинг и Алерты

## Содержание

-   [Обзор](#обзор)
-   [Метрики приложения](#метрики-приложения)
-   [Инфраструктурные метрики](#инфраструктурные-метрики)
-   [Сценарии алертов](#сценарии-алертов)
-   [Настройка Prometheus](#настройка-prometheus)
-   [Grafana Dashboard](#grafana-dashboard)
-   [AlertManager](#alertmanager)
-   [Логирование](#логирование)
-   [Трейсинг](#трейсинг)
-   [SLA и SLO](#sla-и-slo)
-   [Мониторинг через Zabbix](#мониторинг-через-zabbix)

## Обзор

Система мониторинга NebulaHant Server обеспечивает полную видимость состояния приложения, инфраструктуры и пользовательского опыта.

### Компоненты системы мониторинга

-   **Prometheus** - сбор и хранение метрик
-   **Grafana** - визуализация и дашборды
-   **AlertManager** - управление алертами
-   **ELK Stack** - логирование
-   **Jaeger** - трейсинг запросов
-   **Uptime Robot** - внешний мониторинг доступности

## Метрики приложения

### HTTP Метрики

```javascript
// middleware/metrics.js
const prometheus = require('prom-client');

// Счетчики запросов
const httpRequestsTotal = new prometheus.Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status_code', 'user_agent'],
});

// Гистограмма времени ответа
const httpRequestDuration = new prometheus.Histogram({
	name: 'http_request_duration_seconds',
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'route', 'status_code'],
	buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Размер ответов
const httpResponseSize = new prometheus.Histogram({
	name: 'http_response_size_bytes',
	help: 'HTTP response size in bytes',
	labelNames: ['method', 'route', 'status_code'],
	buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
});

// Активные соединения
const httpActiveConnections = new prometheus.Gauge({
	name: 'http_active_connections',
	help: 'Number of active HTTP connections',
});

// Метрики аутентификации
const authAttempts = new prometheus.Counter({
	name: 'auth_attempts_total',
	help: 'Total authentication attempts',
	labelNames: ['method', 'success'],
});

const activeUsers = new prometheus.Gauge({
	name: 'active_users_total',
	help: 'Number of currently active users',
});

// Метрики базы данных
const dbConnections = new prometheus.Gauge({
	name: 'db_connections_active',
	help: 'Number of active database connections',
});

const dbQueryDuration = new prometheus.Histogram({
	name: 'db_query_duration_seconds',
	help: 'Database query duration in seconds',
	labelNames: ['operation', 'table'],
	buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Метрики кэша
const cacheHits = new prometheus.Counter({
	name: 'cache_hits_total',
	help: 'Total cache hits',
});

const cacheMisses = new prometheus.Counter({
	name: 'cache_misses_total',
	help: 'Total cache misses',
});

const cacheSize = new prometheus.Gauge({
	name: 'cache_size_bytes',
	help: 'Current cache size in bytes',
});

// Метрики игровой логики
const gameEvents = new prometheus.Counter({
	name: 'game_events_total',
	help: 'Total game events processed',
	labelNames: ['event_type', 'user_id'],
});

const galaxyProduction = new prometheus.Gauge({
	name: 'galaxy_production_stars_per_second',
	help: 'Star production rate per galaxy',
	labelNames: ['galaxy_id', 'user_id'],
});

const upgradePurchases = new prometheus.Counter({
	name: 'upgrade_purchases_total',
	help: 'Total upgrade purchases',
	labelNames: ['upgrade_type', 'user_id'],
});

// Метрики бизнес-логики
const userRegistrations = new prometheus.Counter({
	name: 'user_registrations_total',
	help: 'Total user registrations',
	labelNames: ['referral_source'],
});

const userLogins = new prometheus.Counter({
	name: 'user_logins_total',
	help: 'Total user logins',
	labelNames: ['method'],
});

const taskCompletions = new prometheus.Counter({
	name: 'task_completions_total',
	help: 'Total task completions',
	labelNames: ['task_type', 'difficulty'],
});

// Метрики производительности
const memoryUsage = new prometheus.Gauge({
	name: 'nodejs_memory_usage_bytes',
	help: 'Node.js memory usage in bytes',
	labelNames: ['type'],
});

const cpuUsage = new prometheus.Gauge({
	name: 'nodejs_cpu_usage_percent',
	help: 'Node.js CPU usage percentage',
});

const eventLoopLag = new prometheus.Histogram({
	name: 'nodejs_eventloop_lag_seconds',
	help: 'Event loop lag in seconds',
	buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

module.exports = {
	httpRequestsTotal,
	httpRequestDuration,
	httpResponseSize,
	httpActiveConnections,
	authAttempts,
	activeUsers,
	dbConnections,
	dbQueryDuration,
	cacheHits,
	cacheMisses,
	cacheSize,
	gameEvents,
	galaxyProduction,
	upgradePurchases,
	userRegistrations,
	userLogins,
	taskCompletions,
	memoryUsage,
	cpuUsage,
	eventLoopLag,
};
```

### Middleware для сбора метрик

```javascript
// middlewares/metrics-middleware.js
const metrics = require('../middleware/metrics');

const metricsMiddleware = (req, res, next) => {
	const start = Date.now();

	// Увеличиваем счетчик запросов
	metrics.httpRequestsTotal.inc({
		method: req.method,
		route: req.route?.path || req.path,
		status_code: res.statusCode,
		user_agent: req.get('User-Agent')?.substring(0, 50) || 'unknown',
	});

	// Отслеживаем размер ответа
	const originalSend = res.send;
	res.send = function (data) {
		const size = Buffer.byteLength(data);
		metrics.httpResponseSize.observe(
			{
				method: req.method,
				route: req.route?.path || req.path,
				status_code: res.statusCode,
			},
			size
		);
		originalSend.call(this, data);
	};

	// Измеряем время ответа
	res.on('finish', () => {
		const duration = (Date.now() - start) / 1000;
		metrics.httpRequestDuration.observe(
			{
				method: req.method,
				route: req.route?.path || req.path,
				status_code: res.statusCode,
			},
			duration
		);
	});

	next();
};

module.exports = metricsMiddleware;
```

## Инфраструктурные метрики

### Системные метрики

```yaml
# monitoring/node-exporter.yml
global:
    scrape_interval: 15s

scrape_configs:
    - job_name: 'node-exporter'
      static_configs:
          - targets: ['node-exporter:9100']
      metrics_path: '/metrics'
      scrape_interval: 10s
      honor_labels: true
```

### База данных

```yaml
# monitoring/postgres-exporter.yml
- job_name: 'postgres'
  static_configs:
      - targets: ['postgres-exporter:9187']
  scrape_interval: 10s
  metrics_path: '/metrics'
  params:
      dsn:
          [
              'postgresql://postgres:password@postgres:5432/nebulahant?sslmode=disable',
          ]
```

### Redis

```yaml
# monitoring/redis-exporter.yml
- job_name: 'redis'
  static_configs:
      - targets: ['redis-exporter:9121']
  scrape_interval: 10s
  metrics_path: '/metrics'
```

## Сценарии алертов

### Критические алерты (P0)

```yaml
# monitoring/rules/critical-alerts.yml
groups:
    - name: critical-alerts
      rules:
          # Сервис недоступен
          - alert: ServiceDown
            expr: up{job="nebulahant-server"} == 0
            for: 1m
            labels:
                severity: critical
                priority: p0
            annotations:
                summary: 'NebulaHant Server is down'
                description: 'Service has been down for more than 1 minute'
                runbook_url: 'https://wiki.nebulahant.com/runbooks/service-down'

          # База данных недоступна
          - alert: DatabaseDown
            expr: up{job="postgres"} == 0
            for: 30s
            labels:
                severity: critical
                priority: p0
            annotations:
                summary: 'Database is down'
                description: 'PostgreSQL database is not responding'
                runbook_url: 'https://wiki.nebulahant.com/runbooks/database-down'

          # Высокий процент ошибок
          - alert: HighErrorRate
            expr: |
                sum(rate(http_requests_total{status=~"5.."}[5m])) 
                / 
                sum(rate(http_requests_total[5m])) > 0.05
            for: 2m
            labels:
                severity: critical
                priority: p0
            annotations:
                summary: 'High error rate detected'
                description: 'Error rate is {{ $value | humanizePercentage }}'
                runbook_url: 'https://wiki.nebulahant.com/runbooks/high-error-rate'

          # Критическое время ответа
          - alert: CriticalResponseTime
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 5
            for: 3m
            labels:
                severity: critical
                priority: p0
            annotations:
                summary: 'Critical response time'
                description: '95th percentile response time is {{ $value }} seconds'
                runbook_url: 'https://wiki.nebulahant.com/runbooks/slow-response-time'

          # Нехватка памяти
          - alert: OutOfMemory
            expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.05
            for: 2m
            labels:
                severity: critical
                priority: p0
            annotations:
                summary: 'System running out of memory'
                description: 'Only {{ $value | humanizePercentage }} memory available'
                runbook_url: 'https://wiki.nebulahant.com/runbooks/out-of-memory'

          # Диск заполнен
          - alert: DiskFull
            expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
            for: 5m
            labels:
                severity: critical
                priority: p0
            annotations:
                summary: 'Disk space critical'
                description: 'Only {{ $value | humanizePercentage }} disk space available'
                runbook_url: 'https://wiki.nebulahant.com/runbooks/disk-full'
```

### Важные алерты (P1)

```yaml
# monitoring/rules/important-alerts.yml
groups:
    - name: important-alerts
      rules:
          # Высокое время ответа
          - alert: HighResponseTime
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
            for: 5m
            labels:
                severity: warning
                priority: p1
            annotations:
                summary: 'High response time detected'
                description: '95th percentile response time is {{ $value }} seconds'

          # Высокая нагрузка на CPU
          - alert: HighCPUUsage
            expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
            for: 5m
            labels:
                severity: warning
                priority: p1
            annotations:
                summary: 'High CPU usage'
                description: 'CPU usage is {{ $value }}%'

          # Высокое использование памяти
          - alert: HighMemoryUsage
            expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.8
            for: 5m
            labels:
                severity: warning
                priority: p1
            annotations:
                summary: 'High memory usage'
                description: 'Memory usage is {{ $value | humanizePercentage }}'

          # Много медленных запросов
          - alert: ManySlowRequests
            expr: rate(http_request_duration_seconds_count{le="+Inf"}[5m]) > 10
            for: 3m
            labels:
                severity: warning
                priority: p1
            annotations:
                summary: 'Many slow requests'
                description: '{{ $value }} slow requests per second'

          # Высокая нагрузка на базу данных
          - alert: HighDatabaseLoad
            expr: pg_stat_activity_count > 100
            for: 5m
            labels:
                severity: warning
                priority: p1
            annotations:
                summary: 'High database load'
                description: '{{ $value }} active database connections'

          # Проблемы с кэшем
          - alert: CacheIssues
            expr: rate(cache_misses_total[5m]) / rate(cache_hits_total[5m]) > 0.5
            for: 5m
            labels:
                severity: warning
                priority: p1
            annotations:
                summary: 'Cache hit rate is low'
                description: 'Cache miss rate is {{ $value | humanizePercentage }}'
```

### Информационные алерты (P2)

```yaml
# monitoring/rules/info-alerts.yml
groups:
    - name: info-alerts
      rules:
          # Низкая активность пользователей
          - alert: LowUserActivity
            expr: active_users_total < 10
            for: 30m
            labels:
                severity: info
                priority: p2
            annotations:
                summary: 'Low user activity'
                description: 'Only {{ $value }} active users'

          # Много новых регистраций
          - alert: HighRegistrationRate
            expr: rate(user_registrations_total[5m]) > 5
            for: 2m
            labels:
                severity: info
                priority: p2
            annotations:
                summary: 'High registration rate'
                description: '{{ $value }} registrations per second'

          # Популярные апгрейды
          - alert: PopularUpgrades
            expr: rate(upgrade_purchases_total[1h]) > 10
            for: 5m
            labels:
                severity: info
                priority: p2
            annotations:
                summary: 'Popular upgrades detected'
                description: '{{ $value }} upgrade purchases per hour'

          # Высокая производительность галактик
          - alert: HighGalaxyProduction
            expr: sum(galaxy_production_stars_per_second) > 1000
            for: 5m
            labels:
                severity: info
                priority: p2
            annotations:
                summary: 'High galaxy production'
                description: 'Total production: {{ $value }} stars/second'
```

## Настройка Prometheus

### Основная конфигурация

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'nebulahant-prod'
    environment: 'production'

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'nebulahant-server'
    static_configs:
      - targets: ['nebulahant-service:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    honor_labels: true
    scrape_timeout: 5s
    metrics_path: '/metrics'
    scheme: 'http'
    tls_config:
      insecure_skip_verify: true

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 10s
    params:
      dsn: ['postgresql://postgres:password@postgres:5432/nebulahant?sslmode=disable']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 10s

  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']
    scrape_interval: 10s

  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://api.nebulahant.com/health
        - https://api.nebulahant.com/metrics
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### Правила записи

```yaml
# monitoring/rules/recording-rules.yml
groups:
    - name: recording-rules
      rules:
          # Общая статистика запросов
          - record: http:requests:rate5m
            expr: sum(rate(http_requests_total[5m])) by (status_code)

          - record: http:requests:rate1h
            expr: sum(rate(http_requests_total[1h])) by (status_code)

          # Время ответа по маршрутам
          - record: http:response_time:p95
            expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))

          - record: http:response_time:p99
            expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))

          # Ошибки по типам
          - record: http:errors:rate5m
            expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (route)

          # Активность пользователей
          - record: users:active:total
            expr: active_users_total

          - record: users:registrations:rate1h
            expr: sum(rate(user_registrations_total[1h]))

          # Производительность игры
          - record: game:production:total
            expr: sum(galaxy_production_stars_per_second)

          - record: game:upgrades:rate1h
            expr: sum(rate(upgrade_purchases_total[1h])) by (upgrade_type)

          # Системные ресурсы
          - record: system:memory:usage_percent
            expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

          - record: system:cpu:usage_percent
            expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

          - record: system:disk:usage_percent
            expr: (node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100
```

## Grafana Dashboard

### Основной дашборд

```json
{
	"dashboard": {
		"title": "NebulaHant Server - Overview",
		"panels": [
			{
				"title": "HTTP Request Rate",
				"type": "graph",
				"targets": [
					{
						"expr": "sum(rate(http_requests_total[5m])) by (status_code)",
						"legendFormat": "{{status_code}}"
					}
				],
				"yAxes": [
					{
						"label": "Requests per second",
						"min": 0
					}
				]
			},
			{
				"title": "Response Time (95th percentile)",
				"type": "graph",
				"targets": [
					{
						"expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))",
						"legendFormat": "{{route}}"
					}
				],
				"yAxes": [
					{
						"label": "Seconds",
						"min": 0
					}
				]
			},
			{
				"title": "Error Rate",
				"type": "graph",
				"targets": [
					{
						"expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
						"legendFormat": "Error Rate"
					}
				],
				"yAxes": [
					{
						"label": "Percentage",
						"min": 0,
						"max": 100
					}
				]
			},
			{
				"title": "Active Users",
				"type": "stat",
				"targets": [
					{
						"expr": "active_users_total"
					}
				],
				"fieldConfig": {
					"defaults": {
						"color": {
							"mode": "thresholds"
						},
						"thresholds": {
							"steps": [
								{ "color": "red", "value": 0 },
								{ "color": "yellow", "value": 50 },
								{ "color": "green", "value": 100 }
							]
						}
					}
				}
			},
			{
				"title": "System Resources",
				"type": "graph",
				"targets": [
					{
						"expr": "system:memory:usage_percent",
						"legendFormat": "Memory Usage"
					},
					{
						"expr": "system:cpu:usage_percent",
						"legendFormat": "CPU Usage"
					}
				],
				"yAxes": [
					{
						"label": "Percentage",
						"min": 0,
						"max": 100
					}
				]
			},
			{
				"title": "Game Metrics",
				"type": "graph",
				"targets": [
					{
						"expr": "game:production:total",
						"legendFormat": "Total Production"
					},
					{
						"expr": "game:upgrades:rate1h",
						"legendFormat": "Upgrade Rate"
					}
				]
			}
		],
		"time": {
			"from": "now-1h",
			"to": "now"
		},
		"refresh": "30s"
	}
}
```

### Игровой дашборд

```json
{
	"dashboard": {
		"title": "NebulaHant - Game Analytics",
		"panels": [
			{
				"title": "User Registrations",
				"type": "graph",
				"targets": [
					{
						"expr": "sum(rate(user_registrations_total[1h])) by (referral_source)",
						"legendFormat": "{{referral_source}}"
					}
				]
			},
			{
				"title": "User Logins",
				"type": "graph",
				"targets": [
					{
						"expr": "sum(rate(user_logins_total[1h])) by (method)",
						"legendFormat": "{{method}}"
					}
				]
			},
			{
				"title": "Galaxy Production by User",
				"type": "table",
				"targets": [
					{
						"expr": "topk(10, sum(galaxy_production_stars_per_second) by (user_id))",
						"format": "table"
					}
				]
			},
			{
				"title": "Popular Upgrades",
				"type": "piechart",
				"targets": [
					{
						"expr": "sum(rate(upgrade_purchases_total[24h])) by (upgrade_type)",
						"legendFormat": "{{upgrade_type}}"
					}
				]
			},
			{
				"title": "Task Completion Rate",
				"type": "graph",
				"targets": [
					{
						"expr": "sum(rate(task_completions_total[1h])) by (task_type)",
						"legendFormat": "{{task_type}}"
					}
				]
			}
		]
	}
}
```

## AlertManager

### Конфигурация

```yaml
# monitoring/alertmanager.yml
global:
    resolve_timeout: 5m
    slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    smtp_smarthost: 'smtp.gmail.com:587'
    smtp_from: 'alerts@nebulahant.com'
    smtp_auth_username: 'alerts@nebulahant.com'
    smtp_auth_password: 'your-password'

route:
    group_by: ['alertname', 'cluster', 'service']
    group_wait: 10s
    group_interval: 10s
    repeat_interval: 1h
    receiver: 'slack-notifications'
    routes:
        - match:
              severity: critical
          receiver: 'pager-duty-critical'
          continue: true
        - match:
              severity: warning
          receiver: 'slack-notifications'
        - match:
              severity: info
          receiver: 'email-notifications'

receivers:
    - name: 'slack-notifications'
      slack_configs:
          - channel: '#alerts'
            title: '{{ template "slack.title" . }}'
            text: '{{ template "slack.text" . }}'
            send_resolved: true

    - name: 'pager-duty-critical'
      pagerduty_configs:
          - service_key: 'your-pagerduty-service-key'
            description: '{{ template "pagerduty.description" . }}'
            severity: '{{ if eq .GroupLabels.severity "critical" }}critical{{ else }}warning{{ end }}'

    - name: 'email-notifications'
      email_configs:
          - to: 'ops@nebulahant.com'
            headers:
                subject: 'NebulaHant Alert: {{ .GroupLabels.alertname }}'
            body: '{{ template "email.body" . }}'

templates:
    - '/etc/alertmanager/template/*.tmpl'

inhibit_rules:
    - source_match:
          severity: 'critical'
      target_match:
          severity: 'warning'
      equal: ['alertname', 'dev', 'instance']
```

### Шаблоны уведомлений

```yaml
# monitoring/templates/slack.tmpl
{{ define "slack.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .CommonLabels.alertname }}
{{ end }}

{{ define "slack.text" }}
{{ range .Alerts }}
*Alert:* {{ .Annotations.summary }}
*Description:* {{ .Annotations.description }}
*Severity:* {{ .Labels.severity }}
*Priority:* {{ .Labels.priority }}
*Started:* {{ .StartsAt | since }}
{{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
{{ end }}
{{ end }}
```

## Логирование

### Структурированные логи

```javascript
// service/logger-service.js
const pino = require('pino');

const logger = pino({
	level: process.env.LOG_LEVEL || 'info',
	serializers: {
		req: (req) => ({
			method: req.method,
			url: req.url,
			headers: req.headers,
			remoteAddress: req.connection.remoteAddress,
			userAgent: req.get('User-Agent'),
		}),
		res: (res) => ({
			statusCode: res.statusCode,
			responseTime: res.responseTime,
		}),
		err: (err) => ({
			type: err.type,
			message: err.message,
			stack: err.stack,
			code: err.code,
		}),
	},
	formatters: {
		level: (label) => {
			return { level: label };
		},
		log: (object) => {
			return {
				...object,
				timestamp: new Date().toISOString(),
				service: 'nebulahant-server',
				version: process.env.npm_package_version,
			};
		},
	},
});

// Middleware для логирования запросов
const requestLogger = (req, res, next) => {
	const start = Date.now();

	res.on('finish', () => {
		const duration = Date.now() - start;
		res.responseTime = duration;

		logger.info(
			{
				req,
				res,
				duration,
				user: req.user?.id,
			},
			'HTTP request completed'
		);
	});

	next();
};

// Логирование ошибок
const errorLogger = (err, req, res, next) => {
	logger.error(
		{
			err,
			req,
			user: req.user?.id,
		},
		'Request error'
	);

	next(err);
};

module.exports = {
	logger,
	requestLogger,
	errorLogger,
};
```

### Логирование игровых событий

```javascript
// service/game-logger.js
const { logger } = require('./logger-service');

class GameLogger {
	logUserRegistration(userId, referralSource) {
		logger.info({
			event: 'user_registration',
			userId,
			referralSource,
			timestamp: new Date().toISOString(),
		});
	}

	logUserLogin(userId, method) {
		logger.info({
			event: 'user_login',
			userId,
			method,
			timestamp: new Date().toISOString(),
		});
	}

	logGalaxyCreation(userId, galaxyId, properties) {
		logger.info({
			event: 'galaxy_creation',
			userId,
			galaxyId,
			properties,
			timestamp: new Date().toISOString(),
		});
	}

	logUpgradePurchase(userId, upgradeId, cost, level) {
		logger.info({
			event: 'upgrade_purchase',
			userId,
			upgradeId,
			cost,
			level,
			timestamp: new Date().toISOString(),
		});
	}

	logTaskCompletion(userId, taskId, reward) {
		logger.info({
			event: 'task_completion',
			userId,
			taskId,
			reward,
			timestamp: new Date().toISOString(),
		});
	}

	logGameEvent(userId, eventId, effects) {
		logger.info({
			event: 'game_event',
			userId,
			eventId,
			effects,
			timestamp: new Date().toISOString(),
		});
	}

	logError(error, context) {
		logger.error({
			event: 'game_error',
			error: {
				message: error.message,
				stack: error.stack,
				code: error.code,
			},
			context,
			timestamp: new Date().toISOString(),
		});
	}
}

module.exports = new GameLogger();
```

## Трейсинг

### Настройка Jaeger

```javascript
// service/tracing-service.js
const { initTracer } = require('jaeger-client');

const config = {
	serviceName: 'nebulahant-server',
	sampler: {
		type: 'probabilistic',
		param: 0.1,
	},
	reporter: {
		logSpans: true,
		agentHost: process.env.JAEGER_AGENT_HOST || 'jaeger-agent',
		agentPort: process.env.JAEGER_AGENT_PORT || 6832,
	},
};

const tracer = initTracer(config);

// Middleware для трейсинга
const tracingMiddleware = (req, res, next) => {
	const span = tracer.startSpan('http_request');
	span.setTag('http.method', req.method);
	span.setTag('http.url', req.url);
	span.setTag('http.user_agent', req.get('User-Agent'));

	if (req.user) {
		span.setTag('user.id', req.user.id);
	}

	req.span = span;

	res.on('finish', () => {
		span.setTag('http.status_code', res.statusCode);
		span.finish();
	});

	next();
};

// Функция для создания дочерних спэнов
const createChildSpan = (parentSpan, operationName, tags = {}) => {
	const span = tracer.startSpan(operationName, { childOf: parentSpan });

	Object.entries(tags).forEach(([key, value]) => {
		span.setTag(key, value);
	});

	return span;
};

module.exports = {
	tracer,
	tracingMiddleware,
	createChildSpan,
};
```

## SLA и SLO

### Service Level Objectives

```yaml
# monitoring/slo.yml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
    name: nebulahant-slo
    namespace: monitoring
spec:
    selector:
        matchLabels:
            app: nebulahant-server
    endpoints:
        - port: metrics
          path: /metrics
          interval: 30s

---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
    name: nebulahant-slo
    namespace: monitoring
spec:
    groups:
        - name: slo
          rules:
              # Доступность 99.9%
              - record: slo:availability:target
                expr: 0.999

              - record: slo:availability:window
                expr: sum(rate(http_requests_total[5m])) / sum(rate(http_requests_total[5m]))

              # Время ответа < 500ms для 95% запросов
              - record: slo:latency:target
                expr: 0.5

              - record: slo:latency:window
                expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

              # Ошибки < 0.1%
              - record: slo:errors:target
                expr: 0.001

              - record: slo:errors:window
                expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

### SLA Dashboard

```json
{
	"dashboard": {
		"title": "NebulaHant - SLA Dashboard",
		"panels": [
			{
				"title": "Availability SLO",
				"type": "stat",
				"targets": [
					{
						"expr": "slo:availability:window * 100",
						"legendFormat": "Current Availability"
					}
				],
				"fieldConfig": {
					"defaults": {
						"thresholds": {
							"steps": [
								{ "color": "red", "value": 0 },
								{ "color": "yellow", "value": 99 },
								{ "color": "green", "value": 99.9 }
							]
						},
						"unit": "percent"
					}
				}
			},
			{
				"title": "Latency SLO",
				"type": "stat",
				"targets": [
					{
						"expr": "slo:latency:window * 1000",
						"legendFormat": "95th Percentile Latency"
					}
				],
				"fieldConfig": {
					"defaults": {
						"thresholds": {
							"steps": [
								{ "color": "green", "value": 0 },
								{ "color": "yellow", "value": 200 },
								{ "color": "red", "value": 500 }
							]
						},
						"unit": "ms"
					}
				}
			},
			{
				"title": "Error Rate SLO",
				"type": "stat",
				"targets": [
					{
						"expr": "slo:errors:window * 100",
						"legendFormat": "Error Rate"
					}
				],
				"fieldConfig": {
					"defaults": {
						"thresholds": {
							"steps": [
								{ "color": "green", "value": 0 },
								{ "color": "yellow", "value": 0.05 },
								{ "color": "red", "value": 0.1 }
							]
						},
						"unit": "percent"
					}
				}
			}
		]
	}
}
```

## Мониторинг через Zabbix

### Установка и базовая настройка Zabbix

1. **Установка Zabbix Server и Agent (Ubuntu/Debian):**
    ```sh
    wget https://repo.zabbix.com/zabbix/6.0/ubuntu/pool/main/z/zabbix-release/zabbix-release_6.0-4+ubuntu20.04_all.deb
    sudo dpkg -i zabbix-release_6.0-4+ubuntu20.04_all.deb
    sudo apt update
    sudo apt install zabbix-server-pgsql zabbix-frontend-php zabbix-apache-conf zabbix-sql-scripts zabbix-agent postgresql
    ```
2. **Создание базы данных PostgreSQL:**
    ```sh
    sudo -u postgres createuser --pwprompt zabbix
    sudo -u postgres createdb -O zabbix zabbix
    zcat /usr/share/zabbix-sql-scripts/postgresql/server.sql.gz | psql -U zabbix -d zabbix
    ```
3. **Настройка подключения к БД:**
   В файле `/etc/zabbix/zabbix_server.conf`:
    ```
    DBHost=localhost
    DBName=zabbix
    DBUser=zabbix
    DBPassword=ВАШ_ПАРОЛЬ
    ```
4. **Запуск сервисов:**
    ```sh
    sudo systemctl restart zabbix-server zabbix-agent apache2
    sudo systemctl enable zabbix-server zabbix-agent apache2
    ```
5. **Веб-интерфейс:**
    - Откройте `http://<IP_СЕРВЕРА>/zabbix` и завершите настройку через мастер.

### Установка и настройка Zabbix Agent на целевых серверах

```sh
sudo apt install zabbix-agent
```

В `/etc/zabbix/zabbix_agentd.conf`:

```
Server=<IP_СЕРВЕРА_ZABBIX>
ServerActive=<IP_СЕРВЕРА_ZABBIX>
Hostname=<ИМЯ_ХОСТА>
```

Перезапуск:

```sh
sudo systemctl restart zabbix-agent
sudo systemctl enable zabbix-agent
```

### Рекомендации по метрикам для Zabbix

#### 1. **Системные метрики**

-   CPU, память, диск, сеть (стандартные шаблоны Zabbix Agent)
-   Доступность сервисов (ICMP ping, TCP checks)

#### 2. **Мониторинг PostgreSQL**

-   Используйте шаблон **"PostgreSQL by Zabbix agent2"** или **Zabbix Database Monitoring**
-   Ключевые метрики:
    -   Доступность БД
    -   Количество активных соединений
    -   Время выполнения запросов
    -   Использование памяти и диска
    -   Количество блокировок
    -   Репликация (если используется)
-   Создайте отдельного пользователя с правами только на чтение для мониторинга.

#### 3. **Мониторинг Node.js приложения**

-   Используйте **Custom UserParameters** или интеграцию с внешними метриками:
    -   Время отклика HTTP (через web-сценарии Zabbix)
    -   Доступность API (HTTP/HTTPS checks)
    -   Использование памяти процесса (`proc.mem`), CPU (`proc.cpu`)
    -   Количество открытых файловых дескрипторов (`proc.num[fd]`)
    -   Логирование ошибок (через log-мониторинг)
-   Для расширенного мониторинга используйте [zabbix-nodejs](https://github.com/zarplata/zabbix-nodejs) или отправку кастомных метрик через zabbix_sender.

#### 4. **Алерты и триггеры**

-   Доступность сервисов (Server/Agent/DB)
-   Высокая загрузка CPU/памяти/диска
-   Ошибки в логах приложения
-   Высокое время ответа API
-   Переполнение очередей/блокировок в PostgreSQL

#### 5. **Рекомендации**

-   Используйте шаблоны Zabbix для быстрой интеграции
-   Настройте алерты по SLA/SLO (например, доступность >99.9%, время ответа <500мс)
-   Включите мониторинг логов для быстрого реагирования на ошибки
-   Регулярно обновляйте Zabbix и шаблоны
-   Документируйте все кастомные элементы и триггеры

### Полезные ссылки

-   [Официальная документация Zabbix (RU)](https://www.zabbix.com/documentation/current/ru/manual/installation)
-   [Мониторинг PostgreSQL](https://www.zabbix.com/documentation/current/ru/manual/config/items/itemtypes/zabbix_agent/pgsql_checks)
-   [Шаблоны Zabbix](https://www.zabbix.com/integrations)
-   [Мониторинг Node.js](https://github.com/zarplata/zabbix-nodejs)

### Примеры алертов и триггеров для Zabbix

#### **1. Системные алерты (CPU, память, диск)**

-   **Высокая загрузка CPU:**

    -   Выражение: `{Template OS Linux:system.cpu.util[,idle].last(5m)}<10`
    -   Описание: CPU простаивает менее 10% в течение 5 минут (нагрузка >90%)

-   **Мало свободной памяти:**

    -   Выражение: `{Template OS Linux:vm.memory.size[available].last()}<500M`
    -   Описание: Свободной памяти меньше 500 МБ

-   **Диск почти заполнен:**
    -   Выражение: `{Template OS Linux:vfs.fs.size[/,pfree].last()}<10`
    -   Описание: Свободно менее 10% места на корневом разделе

#### **2. PostgreSQL**

-   **База данных недоступна:**

    -   Выражение: `{PostgreSQL by Zabbix agent2:pgsql.ping.last()}=0`
    -   Описание: Нет ответа от PostgreSQL

-   **Слишком много соединений:**

    -   Выражение: `{PostgreSQL by Zabbix agent2:pgsql.connections.used.last()}/{PostgreSQL by Zabbix agent2:pgsql.connections.max.last()}>0.8`
    -   Описание: Используется более 80% соединений

-   **Долгие запросы:**
    -   Выражение: `{PostgreSQL by Zabbix agent2:pgsql.query.longest_time.max(5m)}>2`
    -   Описание: Есть запросы дольше 2 секунд

#### **3. Node.js-приложение**

-   **Высокое использование памяти процессом:**

    -   UserParameter (пример): `UserParameter=nodejs.mem,ps -o rss= -p $(pgrep -f 'node')`
    -   Триггер: `{Custom Node.js:nodejs.mem.last()}>500000` (RSS > 500 МБ)

-   **Недоступность API:**

    -   Web-сценарий: HTTP GET `/health` или `/metrics`
    -   Триггер: `last(/Custom Node.js:web.test.fail[api-health])=1`

-   **Ошибки в логах:**
    -   Используйте log-мониторинг:
        -   `log[/var/log/app.log, ERROR, 100, utf8, skip]`
    -   Триггер: `{Custom Node.js:log[/var/log/app.log,ERROR,100,utf8,skip].nodata(5m)}=0`

#### **4. Общие советы по алертам в Zabbix**

-   Не используйте слишком "шумные" алерты — настраивайте пороги, чтобы реагировать только на реальные инциденты.
-   Для критичных сервисов используйте эскалацию: сначала уведомление в чат, затем — SMS/звонок.
-   Группируйте алерты по приоритету (P0 — сервис недоступен, P1 — деградация, P2 — информационные).
-   Используйте maintenance windows для плановых работ, чтобы не получать ложные алерты.
-   Документируйте все кастомные триггеры и действия.
-   Регулярно пересматривайте алерты: убирайте устаревшие, добавляйте новые по мере развития системы.
-   Для бизнес-метрик (например, регистраций, активности пользователей) используйте отдельные алерты с более мягкими порогами.

## Заключение

Эта система мониторинга обеспечивает:

-   **Полную видимость** состояния приложения и инфраструктуры
-   **Проактивное обнаружение** проблем до их влияния на пользователей
-   **Детальную аналитику** игровых метрик и пользовательского поведения
-   **Автоматические алерты** с различными уровнями приоритета
-   **Централизованное логирование** всех событий
-   **Трейсинг запросов** для отладки проблем
-   **SLA/SLO мониторинг** для обеспечения качества сервиса

Регулярно пересматривайте и настраивайте алерты в соответствии с реальными потребностями и производительностью системы.
