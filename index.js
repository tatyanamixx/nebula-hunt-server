/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
require('dotenv').config();
const app = require('./app');
const sequelize = require('./db');
const loggerService = require('./service/logger-service');
const { updateActiveUsers } = require('./service/game-metrics-service');

const PORT = process.env.PORT || 5000;

const start = async () => {
	try {
		await sequelize.authenticate();

		// Инициализация комиссий маркета
		const { MarketCommission } = require('./models/models');
		const marketConfig = require('./config/market.config');

		const commissionData = Object.entries(marketConfig.commission).map(
			([currency, rate]) => ({
				currency,
				rate,
				description: `Fee ${(rate * 100).toFixed(0)}% for ${currency}`,
			})
		);

		for (const entry of commissionData) {
			await MarketCommission.findOrCreate({
				where: { currency: entry.currency },
				defaults: entry,
			});
		}
		loggerService.info('MarketCommission table initialized');

		// Инициализация системного пользователя
		const userService = require('./service/user-service');
		await userService.ensureSystemUserExists();
		loggerService.info('System user initialized');

		app.listen(PORT, () => {
			loggerService.info(`Server started on port ${PORT}`);
			console.log(`Server started on port ${PORT}`);
		});

		setInterval(() => {
			updateActiveUsers().catch(console.error);
		}, 10 * 60 * 1000);

		const {
			prometheusMetrics,
		} = require('./middlewares/prometheus-middleware');
		setInterval(() => {
			prometheusMetrics.updateDbConnections(sequelize);
		}, 10000);
	} catch (e) {
		loggerService.error('Failed to start server:', { error: e.message });
		console.error('Failed to start server:', e);
	}
};

// Запускаем сервер только если файл запущен напрямую, а не импортирован
if (require.main === module) {
	start();
}

// Экспортируем app для тестов
module.exports = { app, start };
