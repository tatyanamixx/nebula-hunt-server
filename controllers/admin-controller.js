/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 * updated by Claude on 26.07.2025
 */
const adminService = require('../service/admin-service');
const ApiError = require('../exceptions/api-error');
const logger = require('../service/logger-service');

class AdminController {
	/**
	 * Google OAuth аутентификация для администраторов
	 */
	async googleOAuth(req, res, next) {
		try {
			const { accessToken } = req.body;
			logger.info('Google OAuth attempt', {
				accessToken: accessToken ? 'present' : 'missing',
			});

			const oauthResult = await adminService.googleOAuth(accessToken);
			logger.info('Google OAuth successful', { result: oauthResult });

			return res.status(200).json(oauthResult);
		} catch (e) {
			logger.error('Google OAuth error', { error: e.message });
			next(e);
		}
	}

	/**
	 * 2FA верификация для Google OAuth
	 */
	async oauth2FAVerify(req, res, next) {
		try {
			const { provider, otp, ...oauthData } = req.body;
			logger.info('OAuth 2FA verification attempt', { provider });

			const verifyResult = await adminService.oauth2FAVerify(
				provider,
				otp,
				oauthData
			);
			logger.info('OAuth 2FA verification successful', { provider });

			return res.status(200).json(verifyResult);
		} catch (e) {
			logger.error('OAuth 2FA verification error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Авторизация админа через email (устаревший метод)
	 */
	async loginAdmin(req, res, next) {
		try {
			const { email } = req.body;
			logger.info('Admin login attempt (deprecated)', { email });

			const loginResult = await adminService.loginAdmin(email);
			logger.info('Admin login successful', {
				email,
				result: loginResult,
			});

			return res.status(200).json(loginResult);
		} catch (e) {
			logger.error('Admin login error', {
				error: e.message,
				email: req.body.email,
			});
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
	 * Проверка 2FA кода для админа (устаревший метод)
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

	/**
	 * Инициализация супервайзера
	 */
	async initSupervisor(req, res, next) {
		try {
			const initResult = await adminService.initSupervisor();
			return res.status(201).json(initResult);
		} catch (e) {
			logger.error('Supervisor init error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Завершение настройки 2FA (для регистрации)
	 */
	async complete2FA(req, res, next) {
		try {
			const { email, otp, inviteToken } = req.body;

			if (!email || !otp || !inviteToken) {
				return next(
					ApiError.BadRequest('Email, OTP and inviteToken required')
				);
			}

			await adminService.complete2FA(email, otp, inviteToken);
			return res.status(200).json({
				message: '2FA setup completed successfully',
			});
		} catch (e) {
			logger.error('Complete 2FA error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Регистрация админа через приглашение
	 */
	async registerAdmin(req, res, next) {
		try {
			const { email, password, name, inviteToken } = req.body;

			if (!email || !password || !name || !inviteToken) {
				return next(
					ApiError.BadRequest(
						'Email, password, name and inviteToken required'
					)
				);
			}

			const registerResult = await adminService.registerAdmin(
				email,
				password,
				name,
				inviteToken
			);
			return res.status(201).json(registerResult);
		} catch (e) {
			logger.error('Admin registration error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Отправка приглашения админу
	 */
	async sendInvite(req, res, next) {
		try {
			const { email, name, role } = req.body;
			const adminId = req.userToken.id;

			if (!email || !name || !role) {
				return next(
					ApiError.BadRequest('Email, name and role required')
				);
			}

			const inviteResult = await adminService.sendInvite(
				email,
				name,
				role,
				adminId
			);
			return res.status(201).json(inviteResult);
		} catch (e) {
			logger.error('Send invite error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Валидация токена приглашения
	 */
	async validateInvite(req, res, next) {
		try {
			const { token } = req.query;

			if (!token) {
				return next(ApiError.BadRequest('Token required'));
			}

			const validateResult = await adminService.validateInvite(token);
			return res.status(200).json(validateResult);
		} catch (e) {
			logger.error('Validate invite error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Получение всех приглашений
	 */
	async getInvites(req, res, next) {
		try {
			const invites = await adminService.getInvites();
			return res.status(200).json(invites);
		} catch (e) {
			logger.error('Get invites error', { error: e.message });
			next(e);
		}
	}

	/**
	 * Получение статистики админа
	 */
	async getStats(req, res, next) {
		try {
			const stats = await adminService.getStats();
			return res.status(200).json(stats);
		} catch (e) {
			logger.error('Get stats error', { error: e.message });
			next(e);
		}
	}
}

module.exports = new AdminController();
