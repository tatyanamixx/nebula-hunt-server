/**
 * Password Service для администраторов
 * created by Claude on 26.07.2025
 */
const bcrypt = require('bcrypt');
const { Admin } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const logger = require('./logger-service');

class PasswordService {
	/**
	 * Хеширование пароля
	 * @param {string} password - Пароль для хеширования
	 * @returns {string} - Хешированный пароль
	 */
	async hashPassword(password) {
		const saltRounds = 12;
		return await bcrypt.hash(password, saltRounds);
	}

	/**
	 * Проверка пароля
	 * @param {string} password - Пароль для проверки
	 * @param {string} hashedPassword - Хешированный пароль
	 * @returns {boolean} - Результат проверки
	 */
	async comparePassword(password, hashedPassword) {
		return await bcrypt.compare(password, hashedPassword);
	}

	/**
	 * Валидация пароля
	 * @param {string} password - Пароль для валидации
	 * @returns {Object} - Результат валидации
	 */
	validatePassword(password) {
		const minLength = process.env.ADMIN_MIN_PASSWORD_LENGTH || 8;

		if (!password || typeof password !== 'string') {
			return { isValid: false, error: 'Пароль обязателен' };
		}

		if (password.length < minLength) {
			return {
				isValid: false,
				error: `Пароль должен содержать минимум ${minLength} символов`,
			};
		}

		// Проверка на наличие цифр
		if (!/\d/.test(password)) {
			return {
				isValid: false,
				error: 'Пароль должен содержать хотя бы одну цифру',
			};
		}

		// Проверка на наличие букв
		if (!/[a-zA-Z]/.test(password)) {
			return {
				isValid: false,
				error: 'Пароль должен содержать хотя бы одну букву',
			};
		}

		// Проверка на наличие специальных символов
		if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
			return {
				isValid: false,
				error: 'Пароль должен содержать хотя бы один специальный символ',
			};
		}

		return { isValid: true };
	}

	/**
	 * Проверка срока действия пароля
	 * @param {Object} admin - Объект администратора
	 * @returns {Object} - Результат проверки
	 */
	checkPasswordExpiry(admin) {
		if (!admin.passwordExpiresAt) {
			return { isExpired: false, daysLeft: null };
		}

		const now = new Date();
		const expiryDate = new Date(admin.passwordExpiresAt);
		const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

		return {
			isExpired: now > expiryDate,
			daysLeft: daysLeft > 0 ? daysLeft : 0,
		};
	}

	/**
	 * Установка срока действия пароля
	 * @param {Object} admin - Объект администратора
	 * @param {string} newPassword - Новый пароль
	 * @returns {Object} - Обновленный администратор
	 */
	async setPasswordWithExpiry(admin, newPassword) {
		const hashedPassword = await this.hashPassword(newPassword);
		const now = new Date();

		// Устанавливаем срок действия пароля, если указана переменная окружения
		const expiryDays = process.env.ADMIN_PASSWORD_EXPIRY_DAYS;
		let passwordExpiresAt = null;

		if (expiryDays && !isNaN(expiryDays)) {
			passwordExpiresAt = new Date(
				now.getTime() + parseInt(expiryDays) * 24 * 60 * 60 * 1000
			);
		}

		admin.password = hashedPassword;
		admin.passwordChangedAt = now;
		admin.passwordExpiresAt = passwordExpiresAt;
		admin.loginAttempts = 0;
		admin.lockedUntil = null;

		await admin.save();
		return admin;
	}

	/**
	 * Проверка блокировки аккаунта
	 * @param {Object} admin - Объект администратора
	 * @returns {Object} - Результат проверки
	 */
	checkAccountLock(admin) {
		if (!admin.lockedUntil) {
			return { isLocked: false };
		}

		const now = new Date();
		const lockUntil = new Date(admin.lockedUntil);

		if (now > lockUntil) {
			// Блокировка истекла, сбрасываем счетчик
			admin.loginAttempts = 0;
			admin.lockedUntil = null;
			admin.save();
			return { isLocked: false };
		}

		const minutesLeft = Math.ceil((lockUntil - now) / (1000 * 60));
		return {
			isLocked: true,
			minutesLeft,
			lockedUntil: admin.lockedUntil,
		};
	}

	/**
	 * Обработка неудачной попытки входа
	 * @param {Object} admin - Объект администратора
	 * @returns {Object} - Обновленный администратор
	 */
	async handleFailedLogin(admin) {
		const maxAttempts = parseInt(process.env.ADMIN_MAX_LOGIN_ATTEMPTS) || 5;
		const lockoutDuration =
			parseInt(process.env.ADMIN_LOCKOUT_DURATION_MINUTES) || 30;

		admin.loginAttempts += 1;

		if (admin.loginAttempts >= maxAttempts) {
			const lockUntil = new Date(
				Date.now() + lockoutDuration * 60 * 1000
			);
			admin.lockedUntil = lockUntil;
			logger.warn('Admin account locked due to failed login attempts', {
				email: admin.email,
				attempts: admin.loginAttempts,
				lockedUntil: lockUntil,
			});
		}

		await admin.save();
		return admin;
	}

	/**
	 * Сброс счетчика неудачных попыток
	 * @param {Object} admin - Объект администратора
	 * @returns {Object} - Обновленный администратор
	 */
	async resetLoginAttempts(admin) {
		admin.loginAttempts = 0;
		admin.lockedUntil = null;
		admin.lastLoginAt = new Date();
		await admin.save();
		return admin;
	}

	/**
	 * Проверка необходимости смены пароля
	 * @param {Object} admin - Объект администратора
	 * @returns {Object} - Результат проверки
	 */
	checkPasswordChangeRequired(admin) {
		const expiryCheck = this.checkPasswordExpiry(admin);

		if (expiryCheck.isExpired) {
			return {
				changeRequired: true,
				reason: 'password_expired',
				message: 'Пароль истек. Необходимо сменить пароль.',
			};
		}

		// Предупреждение за 7 дней до истечения
		if (expiryCheck.daysLeft && expiryCheck.daysLeft <= 7) {
			return {
				changeRequired: false,
				warning: true,
				daysLeft: expiryCheck.daysLeft,
				message: `Пароль истечет через ${expiryCheck.daysLeft} дней. Рекомендуется сменить пароль.`,
			};
		}

		return {
			changeRequired: false,
			warning: false,
		};
	}
}

module.exports = new PasswordService();
