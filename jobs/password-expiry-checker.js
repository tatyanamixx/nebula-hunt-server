const cron = require('node-cron');
const { passwordExpiryService } = require('../service/password-expiry-service');
const logger = require('../service/logger-service');

/**
 * Cron job для проверки истечения паролей администраторов
 * Запускается каждый день в 9:00 утра
 */
const passwordExpiryChecker = cron.schedule(
	'0 9 * * *',
	async () => {
		try {
			logger.info('Starting scheduled password expiry check...');

			await passwordExpiryService.checkPasswordExpiry();

			logger.info(
				'Scheduled password expiry check completed successfully'
			);
		} catch (error) {
			logger.error('Error in scheduled password expiry check:', error);
		}
	},
	{
		scheduled: false, // Не запускаем автоматически
		timezone: 'Europe/Moscow', // Московское время
	}
);

/**
 * Запускает cron job
 */
function startPasswordExpiryChecker() {
	if (process.env.NODE_ENV === 'production') {
		passwordExpiryChecker.start();
		logger.info('Password expiry checker started');
	} else {
		logger.info('Password expiry checker not started in development mode');
	}
}

/**
 * Останавливает cron job
 */
function stopPasswordExpiryChecker() {
	passwordExpiryChecker.stop();
	logger.info('Password expiry checker stopped');
}

/**
 * Запускает проверку вручную (для тестирования)
 */
async function runManualCheck() {
	try {
		logger.info('Running manual password expiry check...');

		await passwordExpiryService.checkPasswordExpiry();

		logger.info('Manual password expiry check completed successfully');
	} catch (error) {
		logger.error('Error in manual password expiry check:', error);
		throw error;
	}
}

module.exports = {
	startPasswordExpiryChecker,
	stopPasswordExpiryChecker,
	runManualCheck,
	passwordExpiryChecker,
};
