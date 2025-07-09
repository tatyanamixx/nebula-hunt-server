const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pino = require('pino');
const pinoHttp = require('pino-http');
const config = require('./config/logger.config');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const helmet = require('helmet');

const router = require('./routes/index');
const errorMiddleware = require('./middlewares/error-middleware');
const { prometheusMetrics } = require('./middlewares/prometheus-middleware');

const app = express();

app.use(helmet());

// Initialize request logger with base Pino instance
const httpLogger = pinoHttp({
	logger: pino(config),
});
app.use(httpLogger);

app.use(
	cors({
		credentials: true,
		origin: process.env.CLIENT_URL,
	})
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', router);

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
