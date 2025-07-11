const express = require('express');
const cookieParser = require('cookie-parser');
const pino = require('pino');
const pinoHttp = require('pino-http');
const config = require('./config/logger.config');
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
const { prometheusMetrics } = require('./middlewares/prometheus-middleware');

const app = express();

// Security middlewares
// Initialize request logger with base Pino instance
const httpLogger = pinoHttp({
	logger: pino(config),
});
app.use(httpLogger);

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

// Добавляем в конфиг настройки для пагинации и срока действия оферт
app.use(express.static(path.resolve(__dirname, 'static')));
app.use('/api', router);

// Запуск скрипта для обработки истекших оферт по расписанию
const marketService = require('./service/market-service');
const CronJob = require('cron').CronJob;

// Запускаем задачу по расписанию (каждый час)
const expiredOffersJob = new CronJob('0 * * * *', async function () {
	try {
		const processedCount = await marketService.processExpiredOffers();
		logger.info(`Обработано ${processedCount} истекших оферт`);
	} catch (error) {
		logger.error(`Ошибка при обработке истекших оферт: ${error.message}`);
	}
});

// Запускаем задачу
expiredOffersJob.start();

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
			url: 'http://localhost:3000',
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

app.use(prometheusMetrics.prometheusHttpMiddleware);

// Healthcheck endpoint
app.get('/health', (req, res) => res.status(200).send('OK'));

app.use(errorMiddleware);

module.exports = app;
