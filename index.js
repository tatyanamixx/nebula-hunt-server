/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pino = require('pino');
const pinoHttp = require('pino-http');
const config = require('./config/logger.config');
//const { swaggerUi, specs } = require('./swagger');

const sequelize = require('./db');
const models = require('./models/models');
const loggerService = require('./service/logger-service');

const router = require('./routes/index');
const errorMiddleware = require('./middlewares/error-middleware');

const PORT = process.env.PORT || 5000;

const app = express();

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
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(errorMiddleware);

const start = async () => {
	try {
		await sequelize.authenticate();
		await sequelize.sync();

		loggerService.info(`Server started on port ${PORT}`);
		app.listen(PORT, () =>
			loggerService.info(`Server started on port ${PORT}`)
		);
	} catch (e) {
		loggerService.error('Failed to start server:', { error: e.message });
	}
};

start();
