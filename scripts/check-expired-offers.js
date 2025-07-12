'use strict';

/**
 * Скрипт для автоматической проверки и обработки истекших оферт
 * Запускать через cron каждый час
 *
 * Примечание: Системные пакеты от игры не имеют даты истечения
 * и не обрабатываются этим скриптом
 */

const marketService = require('../service/market-service');
const logger = require('../service/logger-service');
const { offers } = require('../config/market.config');

async function checkExpiredOffers() {
	try {
		logger.info('Starting expired offers check');

		// Process expired offers
		const count = await marketService.processExpiredOffers();

		logger.info(
			`Expired offers check completed. Processed ${count} offers.`
		);

		return { success: true, count };
	} catch (error) {
		logger.error(`Error checking expired offers: ${error.message}`);
		throw error;
	}
}

// Export function for testing
module.exports = checkExpiredOffers;

// If script is run directly (not through require), execute the check
if (require.main === module) {
	checkExpiredOffers()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
