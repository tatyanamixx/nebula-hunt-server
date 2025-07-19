/**
 * created by Tatyana Mikhniukevich on 28.05.2025
 */
const { Admin } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const tokenService = require('./token-service');
const speakeasy = require('speakeasy');
const logger = require('../service/logger-service');

class AdminService {
	
	async findAdminByEmail(email) {
		const t = await sequelize.transaction();

		try {
		if (!email) {
			throw ApiError.BadRequest('Email is required');
		}
			const admin = await Admin.findOne({ where: { email }, transaction: t });
			await t.commit();
			return admin;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to find admin by email: ${err.message}`);
		}
	}

	async removeAdminToken(refreshToken) {
		await tokenService.removeToken(refreshToken);
	}

	/**
	 * Генерирует токены и формирует ответ для админа
	 * @param {Object} admin - Объект пользователя с ролью ADMIN
	 * @param {string} message - Сообщение для ответа
	 * @returns {Object} - Данные админа и токены
	 */
	async generateAdminTokensAndResponse(admin, message) {
		// Генерируем JWT-токены для админа
		const payload = {
			id: admin.id,
			email: admin.email,
			role: admin.role,
		};
		const tokens = tokenService.generateTokens(payload);

		// Сохраняем refresh токен
		await tokenService.saveAdminToken(admin.id, tokens.refreshToken);

		return {
			message,
			email: admin.email,
			id: admin.id,
			role: admin.role,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		};
	}

	/**
	 * Авторизация админа через email
	 * @param {string} email - Email пользователя
	 * @returns {Object} - Данные админа и токены
	 */
	async loginAdmin(email) {
		if (!email) {
			throw ApiError.BadRequest('Email is required');
		}

		// Проверяем, что пользователь существует и имеет роль ADMIN
		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			logger.warn('Admin login failed: user not found or not admin', {
				email,
			});
			throw ApiError.Forbidden('Access denied');
		}

		// Проверяем, что аккаунт не заблокирован
		if (admin.blocked) {
			logger.warn('Admin login failed: account blocked', {
				email,
			});
			throw ApiError.Forbidden('Account is blocked');
		}

		logger.info('Admin login successful', {
			id: admin.id,
			email: admin.email,
		});

		return await this.generateAdminTokensAndResponse(
			admin,
			'Admin login successful'
		);
	}

	/**
	 * Инициализация админа (назначение роли ADMIN пользователю)
	 * @param {string} telegramId - Telegram ID пользователя
	 * @param {string} secretKey - Секретный ключ для инициализации админа
	 * @returns {Object} - Данные инициализированного админа
	 */
	async initAdmin(email, secretKey) {
		const EXPECTED_SECRET = process.env.ADMIN_INIT_SECRET || 'supersecret';

		// Проверяем секретный ключ
		if (secretKey !== EXPECTED_SECRET) {
			logger.warn('Admin init failed: invalid secret key');
			throw ApiError.Forbidden('Invalid secret key');
		}

		// Находим пользователя по Telegram ID
		const user = await this.findUserByTelegramId(telegramId);
		if (!user) {
			throw ApiError.BadRequest('User with this Telegram id not found');
		}
		if (user.role === 'ADMIN') {
			throw ApiError.BadRequest('User is already admin');
		}

		// Генерируем секрет для Google 2FA
		const google2faSecret = speakeasy.generateSecret({
			length: 20,
			name: `Nebulahunt Admin (${user.username})`,
		});

		// Обновляем пользователя
		user.role = 'ADMIN';
		user.google2faSecret = google2faSecret.base32;
		await user.save();

		logger.info('Admin initialized', {
			id: user.id,
			username: user.username,
		});

		return {
			message: 'Admin initialized',
			username: user.username,
			id: user.id,
			google2faSecret: google2faSecret.base32,
			otpAuthUrl: google2faSecret.otpauth_url,
		};
	}

	/**
	 * Проверка 2FA кода для админа
	 * @param {string} telegramId - Telegram ID пользователя
	 * @param {string} otp - Одноразовый пароль для 2FA
	 * @returns {Object} - Токены доступа
	 */
	async verify2FA(telegramId, otp) {
		if (!telegramId) {
			throw ApiError.BadRequest('Telegram user id required');
		}

		if (!otp) {
			throw ApiError.BadRequest('OTP code required');
		}

		// Находим админа по Telegram ID
		const admin = await this.findAdminByTelegramId(telegramId);
		if (!admin) {
			logger.warn(
				'2FA verification failed: user not found or not admin',
				{
					id: telegramId,
				}
			);
			throw ApiError.Forbidden('Access denied');
		}

		// Проверяем 2FA код
		const verified = speakeasy.totp.verify({
			secret: admin.google2faSecret,
			encoding: 'base32',
			token: otp,
			window: 1, // допускаем +/- 30 сек
		});

		if (!verified) {
			logger.warn('2FA verification failed: invalid code', {
				id: telegramId,
			});
			throw ApiError.Unauthorized('Invalid 2FA code');
		}

		logger.info('2FA verification successful', { id: admin.id });

		return await this.generateAdminTokensAndResponse(
			admin,
			'2FA verification successful'
		);
	}
}

module.exports = new AdminService();
