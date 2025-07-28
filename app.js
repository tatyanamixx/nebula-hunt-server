const express = require('express');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const logger = require('./service/logger-service');

const router = require('./routes/index');
const errorMiddleware = require('./middlewares/error-middleware');
const helmetMiddleware = require('./middlewares/helmet-middleware');
const securityHeadersMiddleware = require('./middlewares/security-headers-middleware');
const corsMiddleware = require('./middlewares/cors-middleware');
const {
	validateRequestSize,
	sanitizeRequestBody,
} = require('./middlewares/request-validation-middleware');
const {
	blockBlacklistedIPs,
	detectSuspiciousIP,
} = require('./middlewares/ip-security-middleware');
const customLoggingMiddleware = require('./middlewares/custom-logging-middleware');
const prometheusService = require('./service/prometheus-service');
const { bigIntSerializationMiddleware } = require('./utils/serialization');

const app = express();

// Security middlewares
// Используем собственный middleware для логирования вместо pino-http
app.use(customLoggingMiddleware);

// Security middlewares
app.use(blockBlacklistedIPs); // IP blacklisting should be first
app.use(detectSuspiciousIP); // Log suspicious IPs
app.use(helmetMiddleware);
app.use(securityHeadersMiddleware);
app.use(corsMiddleware);
app.use(validateRequestSize(2 * 1024 * 1024)); // 2MB max request size

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Request sanitization
app.use(sanitizeRequestBody());

// BigInt serialization middleware
app.use(bigIntSerializationMiddleware);

// Добавляем в конфиг настройки для пагинации и срока действия оферт
app.use(express.static(path.resolve(__dirname, 'static')));
app.use('/api', router);

// Запуск скрипта для обработки истекших оферт по расписанию
// Отключаем cron jobs в тестовом окружении
if (process.env.NODE_ENV !== 'test') {
	const marketService = require('./service/market-service');
	const CronJob = require('cron').CronJob;

	// Запускаем задачу по расписанию (каждый час)
	const expiredOffersJob = new CronJob('0 * * * *', async function () {
		try {
			const processedCount = await marketService.processExpiredOffers();
			logger.info(`Processed ${processedCount} expired offers`);
		} catch (error) {
			logger.error(`Error processing expired offers: ${error.message}`);
		}
	});

	// Запускаем задачу
	expiredOffersJob.start();

	// Запуск периодического обновления Prometheus метрик (каждые 5 минут)
	const metricsUpdateJob = new CronJob('*/5 * * * *', async function () {
		try {
			await prometheusService.updateAllMetrics();
			logger.debug('Prometheus metrics updated successfully');
		} catch (error) {
			logger.error(`Error updating Prometheus metrics: ${error.message}`);
		}
	});

	// Запускаем задачу обновления метрик
	metricsUpdateJob.start();

	// Запуск проверки истечения паролей администраторов (каждый день в 9:00)
	const {
		startPasswordExpiryChecker,
	} = require('./jobs/password-expiry-checker');
	startPasswordExpiryChecker();
}

// Swagger setup
const swaggerDefinition = {
	openapi: '3.0.0',
	info: {
		title: 'Nebulahunt API',
		version: '1.0.0',
		description: 'API documentation for Nebulahunt',
	},
	servers: [
		{
			url: 'http://localhost:5000',
			description: 'Development server',
		},
	],
};

const options = {
	swaggerDefinition,
	apis: ['./routes/*.js'], // JSDoc comments in route files
};

const specs = swaggerJSDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(prometheusService.httpMiddleware.bind(prometheusService));

// Healthcheck endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

app.use(errorMiddleware);

module.exports = app;
