/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const adminService = require('../service/admin-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class AdminController {
	/**
	 * Авторизация админа через email
	 */
	async loginAdmin(req, res, next) {
		try {
			const { email } = req.body;
			const loginResult = await adminService.loginAdmin(email);
			return res.status(200).json(loginResult);
		} catch (e) {
			logger.error('Admin login error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Выход админа из системы
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
	 */
	async initAdmin(req, res, next) {
		try {
			const { email, secretKey } = req.body;

			if (!email) {
				return next(ApiError.BadRequest('Email required'));
			}

			const initResult = await adminService.initAdmin(email, secretKey);
			return res.status(201).json(initResult);
		} catch (e) {
			logger.error('Admin init error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Проверка 2FA кода для админа
	 */
	async verify2FA(req, res, next) {
		try {
			const { email } = req.body;
			const { otp } = req.body;

			const verifyResult = await adminService.verify2FA(email, otp);
			return res.status(200).json(verifyResult);
		} catch (e) {
			logger.error('2FA verification error', { error: e.message });
			next(e);
		}
	}
}

module.exports = new AdminController();
