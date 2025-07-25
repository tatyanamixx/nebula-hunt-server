/**
 * Скрипт для инициализации супервайзера
 * Запускается автоматически при старте сервера
 */
const adminService = require('../service/admin-service');
const logger = require('../service/logger-service');

async function initSupervisor() {
	try {
		logger.info('Initializing supervisor...');
		const result = await adminService.initSupervisor();
		logger.info('Supervisor initialization result:', result);
		return result;
	} catch (error) {
		logger.error('Failed to initialize supervisor:', error.message);
		throw error;
	}
}

module.exports = { initSupervisor };
