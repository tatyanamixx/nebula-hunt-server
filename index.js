/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
require('dotenv').config();
const app = require('./app');
const sequelize = require('./db');
const loggerService = require('./service/logger-service');
const { updateActiveUsers } = require('./service/game-metrics-service');

const PORT = process.env.PORT || 5000;

// Флаг для отслеживания инициализации
let isInitialized = false;

const start = async () => {
	// Защита от повторного запуска
	if (isInitialized) {
		loggerService.warn(
			'Server initialization already completed, skipping...'
		);
		return;
	}

	try {
		await sequelize.authenticate();

		// Инициализация системного пользователя
		const userService = require('./service/user-service');
		await userService.ensureSystemUserExists();
		loggerService.info('System user initialized');

		// Инициализация супервайзера
		const { initSupervisor } = require('./scripts/init-supervisor');
		try {
			const result = await initSupervisor();
			if (result.skipped) {
				loggerService.info(
					'Supervisor initialization skipped (already completed)'
				);
			} else {
				loggerService.info('Supervisor initialized');
			}
		} catch (error) {
			loggerService.warn('Supervisor initialization failed:', {
				error: error.message,
			});
		}

		// Отмечаем инициализацию как завершенную
		isInitialized = true;

		app.listen(PORT, () => {
			loggerService.info(`Server started on port ${PORT}`);
			console.log(`Server started on port ${PORT}`);
		});

		setInterval(() => {
			updateActiveUsers().catch(console.error);
		}, 10 * 60 * 1000);

		const prometheusService = require('./service/prometheus-service');
		setInterval(() => {
			prometheusService.updateDatabaseMetrics();
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
