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

		return { success: true, count };
	} catch (error) {
		logger.error(`Ошибка при проверке истекших оферт: ${error.message}`);
		throw error;
	}
}

// Экспортируем функцию для тестирования
module.exports = checkExpiredOffers;

// Если скрипт запущен напрямую (не через require), выполняем проверку
if (require.main === module) {
	checkExpiredOffers()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
