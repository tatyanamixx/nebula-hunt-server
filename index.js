/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const sequelize = require('./db');
const models = require('./models/models');
const loggerService = require('./service/logger-service');

const router = require('./routes/index');
const errorMiddleware = require('./middlewares/error-middleware');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api', router);

app.use(errorMiddleware);

const start = async () => {
	try {
		await sequelize.authenticate();
		await sequelize.sync();
		app.listen(PORT, () => {
			loggerService.logging(
				'SYSTEM',
				'START',
				`Server started on port ${PORT}`,
				0
			);
		});
	} catch (e) {
		loggerService.logging(
			'SYSTEM',
			'ERROR',
			`Server error: ${e.message}`,
			0
		);
	}
};

start();
