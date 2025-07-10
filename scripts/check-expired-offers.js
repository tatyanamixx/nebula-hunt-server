'use strict';

/**
 * Скрипт для автоматической проверки и обработки истекших оферт
 * Запускать через cron каждый час
 */

const marketService = require('../service/market-service');
const logger = require('../service/logger-service');
const { offers } = require('../config/market.config');

async function checkExpiredOffers() {
	try {
		logger.info('Запуск проверки истекших оферт');

		// Обрабатываем истекшие оферты
		const count = await marketService.processExpiredOffers();

		logger.info(
			`Проверка истекших оферт завершена. Обработано ${count} оферт.`
		);

		process.exit(0);
	} catch (error) {
		logger.error(`Ошибка при проверке истекших оферт: ${error.message}`);
		process.exit(1);
	}
}

// Запускаем проверку
checkExpiredOffers();
