/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const adminService = require('../service/admin-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class AdminController {
	async getUsers(req, res, next) {
		try {
			const users = await adminService.getAllUsers();
			return res.json(users);
		} catch (e) {
			next(e);
		}
	}

	async blockUser(req, res, next) {
		try {
			const { userId } = req.params;
			const user = await adminService.blockUser(userId);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}

	async unblockUser(req, res, next) {
		try {
			const { userId } = req.params;
			const user = await adminService.unblockUser(userId);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Авторизация админа через Telegram WebApp + Google 2FA
	 * Маршрут защищен middleware:
	 * - validateTelegramWebAppData - проверяет данные Telegram WebApp и сохраняет в req.initdata
	 * - google2faMiddleware - проверяет 2FA код
	 */
	async loginAdmin(req, res, next) {
		try {
			const { id, username } = req.initdata;
			const loginResult = await adminService.loginAdmin(id, username);
			return res.status(200).json(loginResult);
		} catch (e) {
			logger.error('Admin login error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Выход админа из системы
	 * Маршрут защищен middleware:
	 * - authMiddleware - проверяет JWT токен
	 * - adminMiddleware - проверяет роль ADMIN
	 */
	async logoutAdmin(req, res, next) {
		try {
			const { refreshToken } = req.body;
			if (!refreshToken) {
				return next(ApiError.BadRequest('refreshToken required'));
			}

			await adminService.removeAdminToken(refreshToken);
			logger.info('Admin logout successful', { id: req.userToken.id });

			return res
				.status(200)
				.json({ message: 'Admin logged out successfully' });
		} catch (e) {
			logger.error('Admin logout error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Инициализация админа (назначение роли ADMIN пользователю)
	 * Защищенный эндпойнт, требует секретный ключ
	 */
	async initAdmin(req, res, next) {
		try {
			const { telegramId, secretKey } = req.body;

			if (!telegramId) {
				return next(ApiError.BadRequest('Telegram ID required'));
			}

			const initResult = await adminService.initAdmin(
				telegramId,
				secretKey
			);
			return res.status(201).json(initResult);
		} catch (e) {
			logger.error('Admin init error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Проверка 2FA кода для админа
	 * Маршрут защищен middleware:
	 * - validateTelegramWebAppData - проверяет данные Telegram WebApp
	 */
	async verify2FA(req, res, next) {
		try {
			const { id } = req.initdata;
			const { otp } = req.body;

			const verifyResult = await adminService.verify2FA(id, otp);
			return res.status(200).json(verifyResult);
		} catch (e) {
			logger.error('2FA verification error', { error: e.message });
			next(e);
		}
	}
}

module.exports = new AdminController();
